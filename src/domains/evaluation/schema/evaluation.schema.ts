import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EmojiDto, HadEvaluation } from '../dto/evaluation.dto';

@Schema({
  timestamps: true,
})
export class Evaluation extends Document {
  @Prop()
  productId: string;

  @Prop({ type: [Object], default: [] })
  emojis: EmojiDto[];

  @Prop({ type: [Object], default: [] })
  hadEvaluation: HadEvaluation[];
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
