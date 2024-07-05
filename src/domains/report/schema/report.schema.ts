import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PolicyType } from 'shared/enums/policy.enum';

@Schema({
  versionKey: false,
  timestamps: true,
})
//
export class Report extends Document {
  @Prop({ type: String })
  subjectId: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String, enum: PolicyType })
  type: PolicyType;

  @Prop({ default: false })
  status: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
