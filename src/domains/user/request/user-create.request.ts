import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
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
    user.avatar =
      'https://res.cloudinary.com/dl3b2j3td/image/upload/v1702564956/TLCN/ov6t50kl5npfmwfopzrk.png';
    user.socialId = null;
    user.socialApp = null;
  }
}
