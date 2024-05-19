import { Message } from '../schema/message.schema';

export class MessageGetAllByConversationRES {
  id: string;
  text: string;
  isRead: boolean;
  isMine: boolean;
  createdAt: Date;

  static of(currentUserId: string, message: Message): MessageGetAllByConversationRES {
    return {
      id: message._id,
      text: message.text,
      isRead: message.isRead,
      isMine: message.senderId === currentUserId,
      createdAt: message['createdAt'],
    };
  }
}
