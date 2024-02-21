import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { AddressProfile } from '../schema/user.schema';

export class UserUpdateREQ {
  @IsOptional()
  @IsString()
  avatar: string;

  @IsOptional()
  @IsString()
  fullName: string;

  @IsOptional()
  address: AddressProfile[];

  @IsOptional()
  phone: string;

  @IsOptional()
  gender: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  birthday: Date;

  @IsOptional()
  wallet: number;

  @IsOptional()
  status: boolean;
}
