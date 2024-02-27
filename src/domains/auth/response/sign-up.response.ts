import { UserCreateRESP } from 'domains/user/response/user-create.response';

export class AuthSignUpRESP {
  static of(user: UserCreateRESP) {
    return user;
  }
}
