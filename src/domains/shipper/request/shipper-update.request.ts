import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { GenderType } from 'shared/enums/common.enum';

export class ShipperUpdateREQ {
  @IsOptional()
  @IsString()
  avatar: string;

  @IsOptional()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  emailShipper: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsEnum(GenderType)
  gender: GenderType;
}
