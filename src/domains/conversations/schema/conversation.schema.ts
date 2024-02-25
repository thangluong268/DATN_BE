import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Conversation extends Document {
  @Prop({ type: [String] })
  participants: string[];

  static toDocModel(
    conversation:
      | (Document<unknown, `object`, Conversation> &
          Conversation & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult
      | (FlattenMaps<Conversation> & {
          _id: Types.ObjectId;
        }),
  ): Conversation {
    return conversation['_doc'] ? conversation['_doc'] : conversation;
  }
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
