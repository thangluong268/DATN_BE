import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
//
export class FeedbackShipper extends Document {
  @Prop({ type: String })
  shipperId: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  billId: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: Number })
  star: number;
}

export const FeedbackShipperSchema = SchemaFactory.createForClass(FeedbackShipper);
