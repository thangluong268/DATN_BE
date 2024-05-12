import { IsString } from 'class-validator';

export class ShipperChangePasswordREQ {
  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;
}
