import { IsString } from 'class-validator';

export class LoginFacebookREQ {
  @IsString()
  accessToken: string;
}
