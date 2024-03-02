import { FlattenMaps, Types } from 'mongoose';
import { Conversation } from '../schema/conversation.schema';

export class ConversationPreviewGetRES {
  conversationId: string;
  lastSenderId: string;
  lastSenderName: string;
  lastSenderAvatar: string;
  lastMessage: string;
  lastTime: Date;
  isMine: boolean;

  static of(
    userId: string,
    conversation: FlattenMaps<Conversation> & {
      _id: Types.ObjectId;
    },
  ) {
    return {
      conversationId: conversation._id.toString(),
      lastSenderId: conversation.lastSenderId,
      lastSenderName: conversation.lastSenderName,
      lastSenderAvatar: conversation.lastSenderAvatar,
      lastMessage: conversation.lastMessage,
      lastTime: conversation['updatedAt'],
      isMine: conversation.lastSenderId === userId,
    };
  }
}
