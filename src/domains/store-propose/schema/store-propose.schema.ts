import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class StorePropose extends Document {
  @Prop({ type: String })
  storeId: string;

  @Prop({ type: String })
  storeAvatar: string;

  @Prop({ type: String })
  storeName: string;

  @Prop({ type: String })
  storeAddress: string;

  @Prop({ types: [String] })
  storePhoneNumber: string[];

  @Prop({ type: String })
  proposeId: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Number })
  timePackage: number;
}

export const StoreProposeSchema = SchemaFactory.createForClass(StorePropose);
