import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Conversation extends Document {
  @Prop({ type: [String] })
  participants: string[];

  @Prop({ type: String })
  lastSenderId: string;

  @Prop({ type: String })
  lastSenderName: string;

  @Prop({ type: String })
  lastSenderAvatar: string;

  @Prop({ type: String })
  lastMessage: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
