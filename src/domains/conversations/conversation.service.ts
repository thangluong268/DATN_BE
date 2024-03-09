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
    const isFirstConversation = await this.isFirstConversation(senderId, receiverId);
    if (isFirstConversation) return await this.create(senderId, receiverId);
  }

  async findOneByParticipants(senderId: string, receiverId: string) {
    return await this.conversationModel.findOne({ participants: { $all: [senderId, receiverId] } }, {}, { lean: true });
  }

  async updateLastMessage(conversationId: string, senderId: string, message: string) {
    const user = await this.userService.findById(senderId);
    await this.conversationModel.findByIdAndUpdate(
      { _id: conversationId },
      {
        lastSenderId: senderId,
        lastSenderName: user.fullName,
        lastSenderAvatar: user.avatar,
        lastMessage: message,
      },
    );
  }

  async findPreviews(userId: string, query: PaginationREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const conversations = await this.conversationModel
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return conversations.map((conversation) => ConversationPreviewGetRES.of(userId, conversation));
  }
}
