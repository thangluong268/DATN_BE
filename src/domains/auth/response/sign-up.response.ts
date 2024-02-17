import { User } from 'src/domains/user/schemas/user.schema';

export class AuthSignUpRESP {
  static fromUser(user: User): User {
    delete user.password;
    delete user['createdAt'];
    delete user['updatedAt'];
    return user;
  }
}
