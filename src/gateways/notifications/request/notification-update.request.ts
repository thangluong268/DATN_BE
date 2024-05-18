import { IsEnum, IsString } from 'class-validator';
import { NotificationType } from 'shared/enums/notification.enum';

export class NotificationUpdateREQ {
  @IsString()
  notificationId: string;

  @IsString()
  content: string;

  @IsEnum(NotificationType)
  type: NotificationType;
}
