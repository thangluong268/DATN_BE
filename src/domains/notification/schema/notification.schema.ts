import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SubNoti } from '../dto/sub-notification.dto';

@Schema({
  timestamps: true,
})
export class Notification extends Document {
  @Prop()
  userIdFrom: string;

  @Prop()
  userIdTo: string;

  @Prop()
  content: string;

  @Prop()
  type: string;

  @Prop({ default: false })
  status: boolean;

  @Prop()
  sub: SubNoti;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
