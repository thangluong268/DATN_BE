import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProductDTO } from 'domains/product/dto/product.dto';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
//
export class Cart extends Document {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  storeId: string;

  @Prop({ type: String })
  storeAvatar: string;

  @Prop({ type: String })
  storeName: string;

  @Prop({ type: [Object] })
  products: ProductDTO[];

  @Prop({ type: Number })
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
