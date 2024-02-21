import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendOTPREQ {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
