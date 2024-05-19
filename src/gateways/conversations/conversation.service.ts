import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserService } from 'domains/user/user.service';
import { Model } from 'mongoose';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { ConversationPreviewGetRES } from './response/conversation-preview-get.response';
import { Conversation } from './schema/conversation.schema';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    private readonly userService: UserService,
  ) {}

  async create(senderId: string, receiverId: string) {
    const newConversation = await this.conversationModel.create({ participants: [senderId, receiverId] });
    return toDocModel(newConversation);
  }

  async isFirstConversation(senderId: string, receiverId: string) {
    const conversation = await this.conversationModel.findOne({ participants: { $all: [senderId, receiverId] } });
    return !conversation;
  }

  async createIfIsFirstConversation(senderId: string, receiverId: string) {
    this.logger.log(`Create conversation between ${senderId} and ${receiverId}`);
    const isFirstConversation = await this.isFirstConversation(senderId, receiverId);
    if (isFirstConversation) return await this.create(senderId, receiverId);
  }

  async findOneByParticipants(senderId: string, receiverId: string) {
    return await this.conversationModel.findOne({ participants: { $all: [senderId, receiverId] } }, {}, { lean: true });
  }

  async updateLastMessage(conversationId: string, senderId: string, messageId: string, messageText: string) {
    const user = await this.userService.findById(senderId);
    await this.conversationModel.updateOne(
      { _id: conversationId },
      {
        lastSenderId: senderId,
        lastSenderName: user.fullName,
        lastSenderAvatar: user.avatar,
        lastMessageId: messageId,
        lastMessageText: messageText,
      },
    );
  }

  async findPreviews(userId: string, query: PaginationREQ) {
    this.logger.log(`Find preview conversations of user ${userId}`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const data = await this.conversationModel.aggregate([
      { $match: { participants: userId } },
      { $addFields: { messageId: { $toObjectId: '$lastMessageId' } } },
      { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'messages' } },
      { $addFields: { isRead: { $first: '$messages.isRead' } } },
      { $addFields: { isMine: { $eq: ['$lastSenderId', userId] } } },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    return data.map((conversation) => ConversationPreviewGetRES.of(userId, conversation));
  }

  async countUnRead(userId: string) {
    this.logger.log(`Count unread messages of user ${userId}`);
    const count = await this.conversationModel.aggregate([
      { $match: { participants: userId } },
      { $addFields: { messageId: { $toObjectId: '$lastMessageId' } } },
      { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'messages' } },
      { $addFields: { isRead: { $first: '$messages.isRead' } } },
      { $match: { isRead: false, lastSenderId: { $ne: userId } } },
      { $group: { _id: null, count: { $sum: 1 } } },
      { $project: { _id: 0, count: 1 } },
    ]);
    return count.length > 0 ? count[0].count : 0;
  }
}
