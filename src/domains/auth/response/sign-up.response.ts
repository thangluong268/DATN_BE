import { User } from 'src/domains/user/schema/user.schema';

export class AuthSignUpRESP {
  static of(user: User): User {
    delete user.password;
    delete user['createdAt'];
    delete user['updatedAt'];
    return user;
  }
}
