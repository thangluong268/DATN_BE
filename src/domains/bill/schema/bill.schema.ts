import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ProductInfoDTO } from '../dto/product-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Bill extends Document {
  @Prop()
  userId: string;

  @Prop()
  storeId: string;

  @Prop({ type: [Object] })
  products: ProductInfoDTO[];

  @Prop()
  notes: string;

  @Prop()
  totalPrice: number;

  @Prop()
  deliveryMethod: string;

  @Prop()
  paymentMethod: string;

  @Prop({ type: Object })
  receiverInfo: ReceiverInfoDTO;

  @Prop({ type: Object || null })
  giveInfo: GiveInfoDTO | null;

  @Prop()
  deliveryFee: number;

  @Prop({ default: 'NEW' })
  status: string;

  @Prop()
  isPaid: boolean;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
