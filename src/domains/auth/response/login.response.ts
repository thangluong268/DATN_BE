import { User } from 'domains/user/schema/user.schema';
import { TokenRESP } from './token.response';

export class AuthLoginRESP {
  static of(user: User, tokens: TokenRESP) {
    return {
      providerData: [
        {
          _id: user._id,
          avatar: user.avatar,
          fullName: user.fullName,
          wallet: user.wallet,
        },
      ],
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      role: user.role,
    };
  }
}
