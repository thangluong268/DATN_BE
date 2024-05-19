import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Message extends Document {
  @Prop({ type: String, required: true })
  conversationId: string;

  @Prop({ type: String, required: true })
  senderId: string;

  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
