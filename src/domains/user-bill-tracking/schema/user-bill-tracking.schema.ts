import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { BILL_STATUS } from 'shared/enums/bill.enum';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class UserBillTracking extends Document {
  @Prop({ type: mongoose.Schema.ObjectId, required: true })
  billId: ObjectId;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String })
  shipperId: string;

  @Prop({ type: Number, default: 1 })
  numOfBehavior: number;

  @Prop({ type: Date, default: null })
  bannedDate: Date;

  @Prop({ enum: BILL_STATUS, required: true })
  status: BILL_STATUS;
}

export const UserBillTrackingSchema = SchemaFactory.createForClass(UserBillTracking);
