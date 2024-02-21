import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, UpdateWriteOpResult } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class UserOTP extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  static toDocModel(
    userOTP:
      | (Document<unknown, `object`, UserOTP> &
          UserOTP & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult,
  ): UserOTP {
    return userOTP['_doc'] ? userOTP['_doc'] : userOTP;
  }
}

export const UserOTPSchema = SchemaFactory.createForClass(UserOTP);
