import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Propose extends Document {
  @Prop({ type: String })
  image: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Number })
  timePackage: number;

  @Prop({ type: Boolean, default: true })
  status: boolean;
}

export const ProposeSchema = SchemaFactory.createForClass(Propose);
