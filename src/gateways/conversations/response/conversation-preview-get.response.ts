import { FlattenMaps, Types } from 'mongoose';
import { Conversation } from '../schema/conversation.schema';
import { User } from 'domains/user/schema/user.schema';

export class ConversationPreviewGetRES {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  lastMessageId: string;
  lastMessageText: string;
  lastTime: Date;
  isMine: boolean;
  isReadLastMessage: boolean;

  static of(
    conversation: FlattenMaps<Conversation> & {
      _id: Types.ObjectId;
      updatedAt: Date;
      isMine: boolean;
      isRead: boolean;
      receiver: User;
    },
  ): ConversationPreviewGetRES {
    return {
      conversationId: conversation._id.toString(),
      receiverId: conversation.receiver._id.toString(),
      receiverName: conversation.receiver.fullName,
      receiverAvatar: conversation.receiver.avatar,
      lastMessageId: conversation.lastMessageId,
      lastMessageText: conversation.lastMessageText,
      lastTime: conversation.updatedAt,
      isMine: conversation.isMine,
      isReadLastMessage: conversation.isRead,
    };
  }
}
