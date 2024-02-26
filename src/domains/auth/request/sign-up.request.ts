import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { PasswordValidator } from 'shared/validators/password.validator';

export class AuthSignUpREQ {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @PasswordValidator()
  password: string;
}
