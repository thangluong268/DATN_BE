import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { UserService } from 'domains/user/user.service';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    const user = await this.userService.findOneByEmailSystem(email);
    if (!user) throw new BadRequestException('Email hoặc mật khẩu không chính xác!');
    if (!user.status) throw new ForbiddenException('Tài khoản của bạn đã bị vô hiệu hóa!');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadRequestException('Email hoặc mật khẩu không chính xác!');
    return user;
  }
}
