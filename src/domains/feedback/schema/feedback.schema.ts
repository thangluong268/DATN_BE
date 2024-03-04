import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Feedback extends Document {
  @Prop()
  productId: string;

  @Prop()
  userId: string;

  @Prop()
  content: string;

  @Prop()
  star: number;

  @Prop()
  consensus: string[];
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
