import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ProductInfoDTO } from '../dto/product-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Bill extends Document {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  storeId: string;

  @Prop({ type: [Object] })
  products: ProductInfoDTO[];

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Number })
  deliveryFee: number;

  @Prop({ type: String })
  promotionId: string;

  @Prop({ type: Number })
  initTotalPrice: number;

  @Prop({ type: Number })
  totalPrice: number;

  @Prop({ type: String })
  deliveryMethod: string;

  @Prop({ type: String, enum: PAYMENT_METHOD })
  paymentMethod: PAYMENT_METHOD;

  @Prop({ type: Object })
  receiverInfo: ReceiverInfoDTO;

  @Prop({ type: Object || null })
  giveInfo: GiveInfoDTO | null;

  @Prop({ default: 'NEW' })
  status: string;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: String })
  paymentId: string;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
