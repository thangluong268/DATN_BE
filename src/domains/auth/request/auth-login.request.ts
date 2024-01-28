import { PasswordValidator } from 'src/shared/validators/password.validator';
import { UsernameValidator } from 'src/shared/validators/username.validator';

export class AuthLoginREQ {
  @UsernameValidator()
  username: string;

  @PasswordValidator()
  password: string;
}
