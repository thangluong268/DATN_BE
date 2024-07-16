import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class StoreWallet extends Document {
  @Prop({ type: String, required: true })
  storeId: string;

  @Prop({ type: Number, default: 0 })
  wallet: number;
}

export const StoreWalletSchema = SchemaFactory.createForClass(StoreWallet);
