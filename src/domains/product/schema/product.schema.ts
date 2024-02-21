import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';

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

  static toDocModel(
    product:
      | (Document<unknown, `object`, Product> &
          Product & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult
      | (FlattenMaps<Product> & {
          _id: Types.ObjectId;
        }),
  ): Product {
    return product['_doc'] ? product['_doc'] : product;
  }
}

export const ProductSchema = SchemaFactory.createForClass(Product);
