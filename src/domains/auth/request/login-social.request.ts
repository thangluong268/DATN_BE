import { IsString } from 'class-validator';

export class LoginSocialREQ {
  @IsString()
  idToken: string;
}
