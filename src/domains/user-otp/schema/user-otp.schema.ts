import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class UserOTP extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  otp: number;
}

export const UserOTPSchema = SchemaFactory.createForClass(UserOTP);
