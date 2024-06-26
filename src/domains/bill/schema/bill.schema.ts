import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BILL_STATUS, PAYMENT_METHOD } from 'shared/enums/bill.enum';
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

  @Prop({ type: Number })
  totalPriceInit: number; // sum(newPrice * quantity) - taxFee

  @Prop({ type: Number })
  totalPricePayment: number; // totalPriceInit - discountValue - coin

  @Prop({ type: String })
  deliveryMethod: string;

  @Prop({ type: String, enum: PAYMENT_METHOD })
  paymentMethod: PAYMENT_METHOD;

  @Prop({ type: Object })
  receiverInfo: ReceiverInfoDTO;

  @Prop({ type: Object || null })
  giveInfo: GiveInfoDTO | null;

  @Prop({ type: String, enum: BILL_STATUS, default: BILL_STATUS.NEW })
  status: BILL_STATUS;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: String, required: true })
  paymentId: string;

  @Prop({ type: Date })
  deliveredDate: Date;

  @Prop({ type: Date })
  processDate: Date;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: [String], default: [] })
  shipperIds: string[];

  @Prop({ type: Boolean, default: false })
  isSuccess: boolean;

  @Prop({ type: Boolean, default: false })
  isRefundSuccess: boolean;

  @Prop({ type: Boolean, default: false })
  isFindShipper: boolean;

  @Prop({ type: Boolean, default: false })
  isShipperConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  isUserConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  isFeedbackShipper: boolean;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
