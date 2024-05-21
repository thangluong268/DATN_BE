import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Store } from 'domains/store/schema/store.schema';
import { ConversationRoomREQ } from 'gateways/conversations/request/conversation-room.request';
import { Conversation } from 'gateways/conversations/schema/conversation.schema';
import { Model } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { UserService } from '../user/user.service';
import { Message } from './schema/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,

    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

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

  async findByConversation(userId: string, body: ConversationRoomREQ, conversationId: string, query: PaginationREQ) {
    const { receiverId, receiverRole } = body;
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const data = await this.messageModel.aggregate([
      { $match: { conversationId: conversationId.toString() } },
      { $addFields: { isMine: { $eq: ['$senderId', userId] } } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 0, id: '$_id', text: 1, isRead: 1, isMine: 1, createdAt: 1 } },
    ]);

    const receiver =
      receiverRole === ROLE_NAME.SELLER
        ? await this.storeModel.findOne({ userId: receiverId }).lean()
        : await this.userService.findById(receiverId);
    const receiverName = receiverRole === ROLE_NAME.SELLER ? receiver['name'] : receiver['fullName'];
    await this.messageModel.updateMany({ conversationId, senderId: { $ne: userId }, isRead: false }, { isRead: true });
    return { data: data.reverse(), conversationId, receiverId, receiverName, receiverAvatar: receiver.avatar };
  }

  async findByConversationOne(userId: string, conversationId: string) {
    const data = await this.messageModel.aggregate([
      { $match: { conversationId: conversationId.toString() } },
      { $addFields: { isMine: { $eq: ['$senderId', userId] } } },
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, id: '$_id', text: 1, isRead: 1, isMine: 1, createdAt: 1 } },
    ]);
    return data[0];
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

  async updateReadStatus(userId: string, conversationId: string) {
    await this.messageModel.updateMany({ conversationId, senderId: { $ne: userId }, isRead: false }, { isRead: true });
  }
}
