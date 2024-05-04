import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class UserRefundTracking extends Document {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: Number, default: 1 })
  numOfRefund: number;

  @Prop({ type: Date, default: null })
  bannedDate: Date;
}

export const UserRefundTrackingSchema = SchemaFactory.createForClass(UserRefundTracking);
