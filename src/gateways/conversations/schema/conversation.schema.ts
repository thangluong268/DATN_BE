import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

export interface ParticipantInterface {
  userId: string;
  role: ROLE_NAME;
}

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Conversation extends Document {
  @Prop({ type: [Object] })
  participants: ParticipantInterface[];

  @Prop({ type: String })
  lastMessageId: string;

  @Prop({ type: String })
  lastMessageText: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
