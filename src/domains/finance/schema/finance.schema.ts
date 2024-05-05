import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Finance extends Document {
  @Prop({ type: Number })
  expense: number;

  @Prop({ type: Number })
  revenue: number;
}

export const FinanceSchema = SchemaFactory.createForClass(Finance);
