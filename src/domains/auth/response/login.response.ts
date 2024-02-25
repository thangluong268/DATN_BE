import { User } from 'src/domains/user/schema/user.schema';
import { ROLE_NAME } from 'src/shared/enums/role-name.enum';
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
