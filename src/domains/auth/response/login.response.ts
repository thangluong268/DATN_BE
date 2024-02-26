import { User } from 'domains/user/schema/user.schema';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { TokenRESP } from './token.response';

export class AuthLoginRESP {
  accessToken: string;
  refreshToken: string;
  role: ROLE_NAME[];

  static of(user: User, tokens: TokenRESP): AuthLoginRESP {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
    };
  }
}
