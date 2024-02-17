import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ForgetPassREQ {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
