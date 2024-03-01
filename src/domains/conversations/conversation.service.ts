import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from './schema/conversation.schema';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
  ) {}

  async create(senderId: string, receiverId: string) {
    const newConversation = await this.conversationModel.create({
      participants: [senderId, receiverId],
    });

    return Conversation.toDocModel(newConversation);
  }

  async isFirstConversation(senderId: string, receiverId: string) {
    const conversation = await this.conversationModel.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    return !conversation;
  }

  async createIfIsFirstConversation(senderId: string, receiverId: string) {
    const isFirstConversation = await this.isFirstConversation(senderId, receiverId);

    if (isFirstConversation) {
      return await this.create(senderId, receiverId);
    }
  }

  async findOneByParticipants(senderId: string, receiverId: string) {
    return await this.conversationModel.findOne(
      {
        participants: { $all: [senderId, receiverId] },
      },
      {},
      { lean: true },
    );
  }
}
