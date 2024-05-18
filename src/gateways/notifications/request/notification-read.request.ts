import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';

export class NotificationReadREQ {
  @IsArray()
  @Type(() => String)
  notificationIds: string[];
}
