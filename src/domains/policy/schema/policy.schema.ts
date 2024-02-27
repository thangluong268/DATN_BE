import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';
import { PolicyObject } from 'shared/enums/policy.enum';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Policy extends Document {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, enum: PolicyObject })
  policyObject: PolicyObject;

  static toDocModel(
    policy:
      | (Document<unknown, `object`, Policy> &
          Policy & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult
      | (FlattenMaps<Policy> & {
          _id: Types.ObjectId;
        }),
  ): Policy {
    return policy['_doc'] ? policy['_doc'] : policy;
  }
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
