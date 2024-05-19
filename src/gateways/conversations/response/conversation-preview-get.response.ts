import { FlattenMaps, Types } from 'mongoose';
import { Conversation } from '../schema/conversation.schema';

export class ConversationPreviewGetRES {
  conversationId: string;
  lastSenderId: string;
  lastSenderName: string;
  lastSenderAvatar: string;
  lastMessageId: string;
  lastMessageText: string;
  lastTime: Date;
  isMine: boolean;
  isRead: boolean;

  static of(
    conversation: FlattenMaps<Conversation> & {
      _id: Types.ObjectId;
      updatedAt: Date;
      isMine: boolean;
      isRead: boolean;
    },
  ): ConversationPreviewGetRES {
    return {
      conversationId: conversation._id.toString(),
      lastSenderId: conversation.lastSenderId,
      lastSenderName: conversation.lastSenderName,
      lastSenderAvatar: conversation.lastSenderAvatar,
      lastMessageId: conversation.lastMessageId,
      lastMessageText: conversation.lastMessageText,
      lastTime: conversation.updatedAt,
      isMine: conversation.isMine,
      isRead: conversation.isRead,
    };
  }
}
