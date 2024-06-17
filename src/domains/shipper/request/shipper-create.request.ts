import { IsEmail, IsEnum, IsString } from 'class-validator';
import { GenderType } from 'shared/enums/common.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

export class ShipperCreateREQ {
  @IsString()
  avatar: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsEnum(GenderType)
  gender: GenderType;

  static toCreate(body: ShipperCreateREQ) {
    return {
      avatar: body.avatar,
      fullName: body.name,
      emailShipper: body.email,
      phone: body.phone,
      addressShipper: body.address,
      gender: body.gender,
      status: false,
      role: ROLE_NAME.SHIPPER,
    };
  }
}
