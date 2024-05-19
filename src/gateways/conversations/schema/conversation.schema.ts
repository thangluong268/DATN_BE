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
  lastMessageId: string;

  @Prop({ type: String })
  lastMessageText: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
