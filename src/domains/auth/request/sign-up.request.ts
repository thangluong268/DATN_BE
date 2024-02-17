import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthSignUpREQ {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
