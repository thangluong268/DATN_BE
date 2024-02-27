import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'domains/user/schema/user.schema';
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
    user.avatar =
      'https://res.cloudinary.com/dl3b2j3td/image/upload/v1702564956/TLCN/ov6t50kl5npfmwfopzrk.png';
    user.role = [ROLE_NAME.USER];
    user.socialId = null;
    user.socialApp = null;
  }
}
