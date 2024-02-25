import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Document, FlattenMaps, Types, UpdateWriteOpResult } from 'mongoose';
import { SOCIAL_APP } from 'src/shared/constants/user.constant';
import { ROLE_NAME } from 'src/shared/enums/role-name.enum';

export class AddressProfile {
  @IsOptional()
  receiverName: string;

  @IsOptional()
  receiverPhone: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  default: boolean = false;
}

@Schema({
  versionKey: false,
  timestamps: true,
})
export class User extends Document {
  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  fullName: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: [Object] })
  address: AddressProfile[];

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  gender: string;

  @Prop({ type: Date })
  birthday: Date;

  @Prop({ type: [String], enum: ROLE_NAME, default: [] })
  role: ROLE_NAME[];

  @Prop({ type: [String], default: [] })
  friends: string[];

  @Prop({ type: [String], default: [] })
  followStores: string[];

  @Prop({ type: Number, default: 0 })
  wallet: number;

  @Prop({ type: Number, default: 0 })
  warningCount: number;

  @Prop({ type: String, default: 'true' })
  status: string;

  @Prop({ type: String })
  socialId: string;

  @Prop({ type: String, enum: SOCIAL_APP })
  socialApp: SOCIAL_APP;

  static toDocModel(
    user:
      | (Document<unknown, `object`, User> &
          User & {
            _id: Types.ObjectId;
          })
      | UpdateWriteOpResult
      | (FlattenMaps<User> & {
          _id: Types.ObjectId;
        }),
  ): User {
    return user['_doc'] ? user['_doc'] : user;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
