import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { Strategy } from 'passport-local';
import { User } from 'src/domains/user/schemas/user.schema';
import { UserService } from 'src/domains/user/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.userService.findOneByEmail(email);
    if (!user)
      throw new BadRequestException('Email hoặc mật khẩu không chính xác!');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new BadRequestException('Email hoặc mật khẩu không chính xác!');
    return user;
  }
}
