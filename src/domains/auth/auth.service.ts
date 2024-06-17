import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { Model } from 'mongoose';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
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

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly userTokenService: UserTokenService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async loginGoogle(idToken: string, socialApp: SOCIAL_APP) {
    this.logger.log(`Login With Social from ${socialApp}`);
    let payload = null;
    try {
      payload = (
        await googleClient.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID,
        })
      ).getPayload();
    } catch (error) {
      throw new UnauthorizedException('Đăng nhập thất bại!');
    }

    const user = await this.userService.findOneByEmail(payload.email);
    if (!user) {
      const dataToCreate = {
        socialId: payload.sub,
        email: payload.email,
        fullName: payload.name,
        avatar: payload.picture,
        socialApp,
      };
      const newUser = await this.userService.createUserSocial(dataToCreate);
      return await this.login(newUser);
    } else {
      if (user.socialApp !== SOCIAL_APP.GOOGLE)
        throw new BadRequestException('Tài khoản đã được sử dụng.\nVui lòng đăng nhập bằng tài khoản khác!');
      return await this.login(user);
    }
  }

  async login(user: User) {
    this.logger.log(`login: ${user.email}`);
    const payload = { userId: user._id.toString() };
    const tokens = await this.getTokens(payload);
    await this.userTokenService.upsert(user._id, tokens.refreshToken);
    return BaseResponse.withMessage(AuthLoginRESP.of(user, tokens), 'Đăng nhập thành công!');
  }

  async signup(body: AuthSignUpREQ) {
    this.logger.log(`signup: ${body.email}`);
    const user = await this.userService.findOneByEmail(body.email);
    if (user) throw new ConflictException('Email đã tồn tại!');
    const newUser = await this.userService.createUserSystem(body);
    const payload = { userId: newUser._id };
    const tokens = await this.getTokens(payload);
    await this.userTokenService.upsert(newUser._id, tokens.refreshToken);
    return BaseResponse.withMessage<AuthSignUpRESP>(AuthSignUpRESP.of(newUser), 'Đăng ký thành công!');
  }

  async forgetPassword(body: ForgetPassREQ) {
    this.logger.log(`forgetPassword: ${body.email}`);
    const user = await this.userService.updatePassword(body);
    return BaseResponse.withMessage<string>(user.email, 'Lấy lại mật khẩu thành công!');
  }

  async logout(user: User) {
    this.logger.log(`logout: ${user.email}`);
    const userToken = await this.userTokenService.delete(user._id);
    if (!userToken) throw new ForbiddenException('Đăng xuất thất bại!');
    return BaseResponse.withMessage<boolean>(true, 'Đăng xuất thành công!');
  }

  async refreshToken(userId: string, refreshToken: string) {
    this.logger.log(`refreshToken: ${userId}`);
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
    this.logger.log(`changeRole: ${userId}`);
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
