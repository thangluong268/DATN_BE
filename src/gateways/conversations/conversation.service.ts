import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageCreateREQ } from 'domains/message/request/message-create.request';
import { Store } from 'domains/store/schema/store.schema';
import { UserService } from 'domains/user/user.service';
import { Model } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { ConversationRoomREQ } from './request/conversation-room.request';
import { ConversationPreviewGetRES } from './response/conversation-preview-get.response';
import { Conversation } from './schema/conversation.schema';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    private readonly userService: UserService,
  ) {}

  async create(senderId: string, senderRole: ROLE_NAME, receiverId: string, receiverRole: ROLE_NAME) {
    const newConversation = await this.conversationModel.create({
      participants: [
        { userId: senderId, role: senderRole },
        { userId: receiverId, role: receiverRole },
      ],
    });
    return toDocModel(newConversation);
  }

  async isFirstConversation(senderId: string, senderRole: ROLE_NAME, receiverId: string, receiverRole: ROLE_NAME) {
    const conversation = await this.conversationModel.findOne({
      participants: {
        $all: [
          { userId: senderId, role: senderRole },
          { userId: receiverId, role: receiverRole },
        ],
      },
    });
    return !conversation;
  }

  async createIfIsFirstConversation(senderId: string, body: MessageCreateREQ) {
    const { senderRole, receiverId, receiverRole } = body;
    this.logger.log(`Create conversation between ${senderId} and ${receiverId}`);
    const isFirstConversation = await this.isFirstConversation(senderId, senderRole, receiverId, receiverRole);
    if (isFirstConversation) return await this.create(senderId, senderRole, receiverId, receiverRole);
  }

  async findOneByParticipants(senderId: string, body: MessageCreateREQ | ConversationRoomREQ) {
    const { senderRole, receiverId, receiverRole } = body;
    return await this.conversationModel
      .findOne({
        participants: {
          $all: [
            { userId: senderId, role: senderRole },
            { userId: receiverId, role: receiverRole },
          ],
        },
      })
      .lean();
  }

  async updateLastMessage(conversationId: string, messageId: string, messageText: string) {
    await this.conversationModel.updateOne(
      { _id: conversationId },
      {
        lastMessageId: messageId,
        lastMessageText: messageText,
      },
    );
  }

  async findPreviews(userId: string, senderRole: ROLE_NAME, query: PaginationREQ) {
    this.logger.log(`Find preview conversations of user ${userId}`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const data = await this.conversationModel.aggregate([
      { $match: { participants: { userId, role: senderRole } } },
      { $addFields: { messageId: { $toObjectId: '$lastMessageId' } } },
      { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'messages' } },
      { $addFields: { isRead: { $first: '$messages.isRead' } } },
      { $addFields: { isMine: { $eq: [{ $first: '$messages.senderId' }, userId] } } },
      {
        $addFields: {
          receiver: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$participants',
                  as: 'participant',
                  cond: { $ne: ['$$participant.userId', userId] },
                },
              },
              0,
            ],
          },
        },
      },
      { $addFields: { receiverId: '$receiver.userId', receiverRole: '$receiver.role' } },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const res = await Promise.all(
      data.map(async (conversation) => {
        const receiver =
          conversation.receiverRole === ROLE_NAME.SELLER
            ? await this.storeModel.findOne({ userId: conversation.receiverId }).lean()
            : await this.userService.findById(conversation.receiverId);
        return ConversationPreviewGetRES.of(conversation, senderRole, receiver);
      }),
    );
    return { role: senderRole, data: res };
  }

  async countUnRead(userId: string, senderRole: ROLE_NAME) {
    this.logger.log(`Count unread messages of user ${userId}`);
    const data = await this.conversationModel.aggregate([
      { $match: { participants: { userId, role: senderRole } } },
      { $addFields: { messageId: { $toObjectId: '$lastMessageId' } } },
      { $lookup: { from: 'messages', localField: 'messageId', foreignField: '_id', as: 'messages' } },
      { $addFields: { isRead: { $first: '$messages.isRead' } } },
      { $match: { isRead: false, lastSenderId: { $ne: userId } } },
      { $group: { _id: null, count: { $sum: 1 } } },
      { $project: { _id: 0, count: 1 } },
    ]);
    const count = data.length > 0 ? data[0].count : 0;
    return { role: senderRole, count };
  }
}
