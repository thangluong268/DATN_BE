import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { UserService } from '../user/user.service';
import { MessageGetAllByConversationRES } from './response/message-get-all-by-conversation.response';
import { Message } from './schema/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,

    private readonly userService: UserService,
  ) {}

  async create(conversationId: string, userId: string, text: string) {
    await this.messageModel.create({
      conversationId,
      text,
      senderId: userId,
    });
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

    return PaginationResponse.ofWithTotal(messagesRes, total);
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
