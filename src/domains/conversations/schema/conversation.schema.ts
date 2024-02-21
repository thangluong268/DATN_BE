import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';
import { CONVERSATION_RELATIONSHIP } from 'src/shared/enums/conversation.enum';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Conversation extends Document {
  @Prop({ type: [String] })
  participants: string[];

  @Prop({ enum: CONVERSATION_RELATIONSHIP })
  relationship: CONVERSATION_RELATIONSHIP;

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
