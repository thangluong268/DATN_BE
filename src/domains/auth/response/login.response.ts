import { User } from 'src/domains/user/schema/user.schema';
import { TokenRESP } from './token.response';

export class AuthLoginRESP {
  providerData: User[];
  stsTokenManager: TokenRESP;
  role: string[];

  static of(user: User, tokens: TokenRESP): AuthLoginRESP {
    delete user.password;
    delete user['createdAt'];
    delete user['updatedAt'];
    return {
      providerData: [user],
      stsTokenManager: tokens,
      role: user.role,
    };
  }
}
