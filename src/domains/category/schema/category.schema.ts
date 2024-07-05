import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
//
export class Category extends Document {
  @Prop()
  name: string;

  @Prop()
  url: string;

  @Prop({ default: true })
  status: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
