import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { GenderType } from 'shared/enums/common.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Shipper extends Document {
  @Prop({ type: String })
  avatar: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String, enum: GenderType })
  gender: GenderType;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: String })
  userName: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, default: ROLE_NAME.SHIPPER })
  role: ROLE_NAME;
}

export const ShipperSchema = SchemaFactory.createForClass(Shipper);
