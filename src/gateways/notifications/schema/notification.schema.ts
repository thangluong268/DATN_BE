import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType } from 'shared/enums/notification.enum';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Notification extends Document {
  @Prop({ type: String })
  receiverId: string;

  @Prop({ type: String })
  subjectId: string;

  @Prop({ type: String })
  subjectAvatar: string;

  @Prop({ type: String })
  subjectName: string;

  @Prop({ type: String })
  content: string;

  @Prop({ enum: NotificationType })
  type: NotificationType;

  @Prop({ type: String })
  link: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
