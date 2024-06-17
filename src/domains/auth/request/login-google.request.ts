import { IsString } from 'class-validator';

export class LoginGoogleREQ {
  @IsString()
  idToken: string;
}
