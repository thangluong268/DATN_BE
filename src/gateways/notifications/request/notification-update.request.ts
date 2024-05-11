import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationType } from 'shared/enums/notification.enum';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';

export class NotificationUpdateREQ {
  @IsString()
  notificationId: string;

  @IsOptional()
  @BooleanValidator()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
