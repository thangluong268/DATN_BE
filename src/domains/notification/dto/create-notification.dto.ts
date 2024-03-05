import { IsNotEmpty } from 'class-validator';
import { SubNoti } from './sub-notification.dto';

export class CreateNotificationDto {
  @IsNotEmpty()
  userIdFrom: string;

  @IsNotEmpty()
  userIdTo: string;

  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  sub: SubNoti;
}
