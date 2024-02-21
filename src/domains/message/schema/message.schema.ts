import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';

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

  static toDocModel(
    message:
      | (Document<unknown, `object`, Message> &
          Message & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult
      | (FlattenMaps<Message> & {
          _id: Types.ObjectId;
        }),
  ): Message {
    return message['_doc'] ? message['_doc'] : message;
  }
}

export const MessageSchema = SchemaFactory.createForClass(Message);
