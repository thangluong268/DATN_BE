import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Finance extends Document {
  @Prop({ type: Number, default: 0 })
  expense: number;

  @Prop({ type: Number, default: 0 })
  revenue: number;
}

export const FinanceSchema = SchemaFactory.createForClass(Finance);
