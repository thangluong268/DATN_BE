import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { CartInfoDTO } from '../dto/cart-info.dto';
import { GiveInfoDTO } from '../dto/give-info.dto';
import { ReceiverInfoDTO } from '../dto/receiver-info.dto';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class BillUser extends Document {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: [Object] })
  data: CartInfoDTO[];

  @Prop({ type: String })
  deliveryMethod: string;

  @Prop({ type: String, enum: PAYMENT_METHOD })
  paymentMethod: PAYMENT_METHOD;

  @Prop({ type: Object })
  receiverInfo: ReceiverInfoDTO;

  @Prop({ type: Object || null })
  giveInfo: GiveInfoDTO | null;

  @Prop({ type: String })
  promotionId: string;

  @Prop({ type: Number })
  coins: number;

  @Prop({ type: Number })
  initTotalPayment: number;

  @Prop({ type: Number })
  totalPayment: number;

  @Prop({ type: Number })
  totalDeliveryFee: number;

  @Prop({ type: Number })
  discountValue: number;

  @Prop({ type: String })
  paymentId: string;
}

export const BillUserSchema = SchemaFactory.createForClass(BillUser);
