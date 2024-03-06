import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EmojiDTO, HadEvaluationDTO } from '../dto/evaluation.dto';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Evaluation extends Document {
  @Prop({ type: String, required: true })
  productId: string;

  @Prop({ type: [Object], default: [] })
  emojis: EmojiDTO[];

  @Prop({ type: [Object], default: [] })
  hadEvaluation: HadEvaluationDTO[];
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
