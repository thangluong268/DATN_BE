import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PolicyType } from 'shared/enums/policy.enum';

@Schema({
  versionKey: false,
  timestamps: true,
})
//
export class Policy extends Document {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, enum: PolicyType })
  type: PolicyType;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
