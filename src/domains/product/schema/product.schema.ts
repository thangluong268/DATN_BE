import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Product extends Document {
  @Prop({ type: [String] })
  avatar: string[];

  @Prop({ type: Number })
  quantity: number;

  @Prop({ type: String })
  name: string;

  @Prop({ type: Number })
  oldPrice: number;

  @Prop({ type: Number })
  newPrice: number;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  categoryId: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: String })
  storeId: string;

  @Prop({ type: Boolean, default: true })
  status: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
