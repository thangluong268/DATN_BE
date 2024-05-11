import { IsEmail, IsEnum, IsString } from 'class-validator';
import { GenderType } from 'shared/enums/common.enum';

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
}
