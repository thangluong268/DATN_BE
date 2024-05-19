import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation } from 'gateways/conversations/schema/conversation.schema';
import { Model } from 'mongoose';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { UserService } from '../user/user.service';
import { MessageGetAllByConversationRES } from './response/message-get-all-by-conversation.response';
import { Message } from './schema/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,

    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    private readonly userService: UserService,
  ) {}

  async create(conversationId: string, userId: string, text: string) {
    const newMessage = await this.messageModel.create({
      conversationId,
      text,
      senderId: userId,
    });
    return toDocModel(newMessage);
  }

  async findByConversation(userId: string, conversationId: string, query: PaginationREQ) {
    const condition = { conversationId };
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.messageModel.countDocuments(condition);
    const messages = await this.messageModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const messagesRes: MessageGetAllByConversationRES[] = [];

    for (const message of messages) {
      const sender = await this.userService.findById(message.senderId);
      messagesRes.push(MessageGetAllByConversationRES.of(userId, message, sender));
    }

    const messageIdsToRead = messages
      .filter((message) => message.senderId !== userId && !message.isRead)
      .map((message) => message._id);
    await this.updateReadStatus(messageIdsToRead);

    console.log(messagesRes);

    const unReadCount = await this.messageModel.countDocuments({ senderId: { $ne: userId }, conversationId, isRead: false });
    if (messageIdsToRead.length > 0) {
      await this.conversationModel.updateOne(
        { _id: conversationId, 'participants.userId': userId },
        { 'participants.$.unReadCount': unReadCount },
      );
    }

    console.log(messagesRes);

    return { data: messagesRes, total, unReadCount };
  }

  async findById(id: string) {
    return await this.messageModel.findById(id, {}, { lean: true });
  }

  async delete(userId: string, messageId: string) {
    const message = await this.findById(messageId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin nhắn này.');
    }
    await this.messageModel.findByIdAndDelete(messageId, { lean: true });
    return message;
  }

  async updateReadStatus(messageIdsToRead: string[]) {
    await this.messageModel.updateMany({ _id: { $in: messageIdsToRead } }, { isRead: true });
  }
}
