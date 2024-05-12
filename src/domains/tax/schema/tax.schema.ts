import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Tax extends Document {
  @Prop({ type: String })
  storeId: string;

  @Prop({ type: String })
  shipperId: string;

  @Prop({ type: Number })
  totalPrice: number;

  @Prop({ type: Number })
  taxFee: number;

  @Prop({ type: String })
  paymentId: string;
}

export const TaxSchema = SchemaFactory.createForClass(Tax);
