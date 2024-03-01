import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Product extends Document {
  @Prop({ type: [String] })
  avatar: string[];

  @Prop()
  quantity: number;

  @Prop()
  name: string;

  @Prop()
  oldPrice: number;

  @Prop()
  newPrice: number;

  @Prop()
  description: string;

  @Prop()
  categoryId: string;

  @Prop({ type: [String] })
  keywords: string[];

  @Prop()
  storeId: string;

  @Prop({ default: true })
  status: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
