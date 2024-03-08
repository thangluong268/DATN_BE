import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import {
  JWT_ACCESS_TOKEN_EXPIRES,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_EXPIRES,
  JWT_REFRESH_TOKEN_SECRET,
} from '../../app.config';
import { BaseResponse } from '../../shared/generics/base.response';
import { UserTokenService } from '../user-token/user-token.service';
import { User } from '../user/schema/user.schema';
import { UserService } from '../user/user.service';
import { AuthSetRoleUserREQ } from './request/auth-set-role-user.request';
import { ForgetPassREQ } from './request/forget-password.request';
import { AuthSignUpREQ } from './request/sign-up.request';
import { AuthLoginRESP } from './response/login.response';
import { AuthSignUpRESP } from './response/sign-up.response';
import { TokenRESP } from './response/token.response';
import { JwtPayload } from './strategies/auth-jwt-at.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly userService: UserService,
    private readonly userTokenService: UserTokenService,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithSocial(req) {
    if (!req.user) {
      return `No user from ${req.user.socialApp}`;
    }
    const { email, socialId, socialApp } = req.user;
    const user = await this.userService.findOneBySocial(email, socialId, socialApp);
    if (!user) {
      const newUser = await this.userService.createUserSocial(req.user);
      return await this.login(newUser);
    }
    return await this.login(user);
  }

  async login(user: User) {
    const payload = { userId: user._id };
    const tokens = await this.getTokens(payload);
    await this.userTokenService.upsert(user._id, tokens.refreshToken);
    return BaseResponse.withMessage<AuthLoginRESP>(AuthLoginRESP.of(user, tokens), 'Đăng nhập thành công!');
  }

  async signup(body: AuthSignUpREQ) {
    const user = await this.userService.findOneByEmailSystem(body.email);
    if (user) throw new ConflictException('Email đã tồn tại!');
    const newUser = await this.userService.createUserSystem(body);
    const payload = { userId: newUser._id };
    const tokens = await this.getTokens(payload);
    await this.userTokenService.upsert(newUser._id, tokens.refreshToken);
    return BaseResponse.withMessage<AuthSignUpRESP>(AuthSignUpRESP.of(newUser), 'Đăng ký thành công!');
  }

  async forgetPassword(body: ForgetPassREQ) {
    const user = await this.userService.updatePassword(body);
    return BaseResponse.withMessage<string>(user.email, 'Lấy lại mật khẩu thành công!');
  }

  async logout(user: User) {
    const userToken = await this.userTokenService.delete(user._id);
    if (!userToken) throw new ForbiddenException('Đăng xuất thất bại!');
    return BaseResponse.withMessage<boolean>(true, 'Đăng xuất thành công!');
  }

  async refreshToken(userId: string, refreshToken: string) {
    const userToken = await this.userTokenService.findByUserId(userId);
    if (!userToken) throw new ForbiddenException('Không tìm thấy token!');
    const isMatched = await bcrypt.compare(refreshToken, userToken.hashedRefreshToken);
    if (!isMatched) throw new ForbiddenException('Token không hợp lệ!');
    const payload = { userId };
    const tokens = await this.getTokens(payload);
    await this.userTokenService.upsert(userToken.userId, tokens.refreshToken);
    return BaseResponse.withMessage<TokenRESP>(tokens, 'Lấy token mới thành công!');
  }

  async changeRole(userId: string, query: AuthSetRoleUserREQ) {
    if (query.role === ROLE_NAME.ADMIN) {
      throw new ForbiddenException(`Không thể cấp quyền ${ROLE_NAME.ADMIN}!`);
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng!');
    }
    await this.userModel.findByIdAndUpdate({ _id: userId }, { role: [query.role] }, { new: true, lean: true });
    return BaseResponse.withMessage<string>(query.role, 'Cập nhật quyền thành công!');
  }

  async getTokens(payload: JwtPayload): Promise<TokenRESP> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: JWT_ACCESS_TOKEN_SECRET,
        expiresIn: JWT_ACCESS_TOKEN_EXPIRES,
      }),
      this.jwtService.signAsync(payload, {
        secret: JWT_REFRESH_TOKEN_SECRET,
        expiresIn: JWT_REFRESH_TOKEN_EXPIRES,
      }),
    ]);
    return {
      accessToken: at,
      refreshToken: rt,
    } as TokenRESP;
  }
}
