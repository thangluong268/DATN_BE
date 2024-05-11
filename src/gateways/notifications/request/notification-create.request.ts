import { IsString } from 'class-validator';

export class NotificationCreateREQ {
  @IsString()
  receiverId: string;
}
