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

  async findByConversation(userId: string, receiverId: string, conversationId: string, query: PaginationREQ) {
    const condition = { conversationId };
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const messages = await this.messageModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const data: MessageGetAllByConversationRES[] = messages.map((message) => MessageGetAllByConversationRES.of(userId, message));
    const receiver = await this.userService.findById(receiverId);

    await this.messageModel.updateMany({ conversationId, senderId: { $ne: userId }, isRead: false }, { isRead: true });
    return { data, conversationId, receiverId, receiverName: receiver.fullName, receiverAvatar: receiver.avatar };
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
}
