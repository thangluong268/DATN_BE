import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { AVATAR_USER_DEFAULT } from 'shared/constants/common.constant';
import { PasswordValidator } from 'shared/validators/password.validator';
import { User } from '../schema/user.schema';

export class UserCreateREQ {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @PasswordValidator()
  password: string;

  static setDefault(user: User) {
    user.avatar = AVATAR_USER_DEFAULT;
  }
}
