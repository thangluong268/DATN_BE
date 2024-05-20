import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { FlattenMaps, Types } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { Conversation } from '../schema/conversation.schema';

export class ConversationPreviewGetRES {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  receiverRole: ROLE_NAME;
  senderRole: ROLE_NAME;
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
      receiverRole: ROLE_NAME;
    },
    senderRole: ROLE_NAME,
    receiver: User | Store,
    receiverId: string,
  ): ConversationPreviewGetRES {
    return {
      conversationId: conversation._id.toString(),
      receiverId,
      receiverName: conversation.receiverRole === ROLE_NAME.SELLER ? receiver['name'] : receiver['fullName'],
      receiverAvatar: receiver.avatar,
      receiverRole: conversation.receiverRole,
      senderRole,
      lastMessageId: conversation.lastMessageId,
      lastMessageText: conversation.lastMessageText,
      lastTime: conversation.updatedAt,
      isMine: conversation.isMine,
      isReadLastMessage: conversation.isRead,
    };
  }
}
