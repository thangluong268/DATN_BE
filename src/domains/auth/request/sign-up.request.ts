import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'domains/user/schema/user.schema';
import { AVATAR_USER_DEFAULT } from 'shared/constants/common.constant';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
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

  static setDefault(user: User) {
    user.avatar = AVATAR_USER_DEFAULT;
    user.role = [ROLE_NAME.USER];
  }
}
