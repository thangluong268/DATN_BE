import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CheckOTPREQ {
  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
