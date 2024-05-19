import { FlattenMaps, Types } from 'mongoose';
import { Conversation } from '../schema/conversation.schema';

export class ConversationPreviewGetRES {
  conversationId: string;
  receiverId: string;
  lastSenderId: string;
  lastSenderName: string;
  lastSenderAvatar: string;
  lastMessageId: string;
  lastMessageText: string;
  lastTime: Date;
  isMine: boolean;
  isReadLastMessage: boolean;

  static of(
    userId: string,
    conversation: FlattenMaps<Conversation> & {
      _id: Types.ObjectId;
      updatedAt: Date;
      isMine: boolean;
      isRead: boolean;
    },
  ): ConversationPreviewGetRES {
    return {
      conversationId: conversation._id.toString(),
      receiverId: conversation.participants.find((participant) => participant !== userId),
      lastSenderId: conversation.lastSenderId,
      lastSenderName: conversation.lastSenderName,
      lastSenderAvatar: conversation.lastSenderAvatar,
      lastMessageId: conversation.lastMessageId,
      lastMessageText: conversation.lastMessageText,
      lastTime: conversation.updatedAt,
      isMine: conversation.isMine,
      isReadLastMessage: conversation.isRead,
    };
  }
}
