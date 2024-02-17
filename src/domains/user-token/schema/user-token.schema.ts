import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class UserToken extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  hashedRefreshToken: string;
}

export const UserTokenSchema = SchemaFactory.createForClass(UserToken);
