import { User } from 'domains/user/schema/user.schema';
import { Message } from '../schema/message.schema';

export class MessageGetAllByConversationRES {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  isRead: boolean;
  isMine: boolean;

  static of(currentUserId: string, message: Message, sender: User): MessageGetAllByConversationRES {
    return {
      id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: sender.fullName,
      senderAvatar: sender.avatar,
      text: message.text,
      isRead: message.isRead,
      isMine: message.senderId === currentUserId,
    };
  }
}
