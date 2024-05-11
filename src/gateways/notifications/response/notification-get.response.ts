import { NotificationType } from 'shared/enums/notification.enum';
import { Notification } from '../schema/notification.schema';

export class NotificationGetRESP {
  id: string;
  receiverId: string;
  subjectId: string;
  subjectAvatar: string;
  subjectName: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  updatedAt: Date;

  static of(notification: Notification): NotificationGetRESP {
    return {
      id: notification._id,
      receiverId: notification.receiverId,
      subjectId: notification.subjectId,
      subjectAvatar: notification.subjectAvatar,
      subjectName: notification.subjectName,
      content: notification.content,
      type: notification.type,
      isRead: notification.isRead,
      updatedAt: notification['updatedAt'],
    };
  }
}
