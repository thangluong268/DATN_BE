import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Feedback extends Document {
  @Prop({ type: String, required: true })
  productId: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: Number })
  star: number;

  @Prop({ type: [String], default: [] })
  consensus: string[];
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
