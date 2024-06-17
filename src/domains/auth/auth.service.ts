import {
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
import { URL_GET_PROFILE_FACEBOOK } from 'shared/constants/common.constant';
import { SOCIAL_APP } from 'shared/constants/user.constant';
import { AxiosType } from 'shared/enums/common.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { isArrayIncludeObject } from 'shared/helpers/lodash.helper';
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
import { SocialProvider, User } from '../user/schema/user.schema';
import { UserService } from '../user/user.service';
import { AuthSetRoleUserREQ } from './request/auth-set-role-user.request';
import { ForgetPassREQ } from './request/forget-password.request';
import { AuthSignUpREQ } from './request/sign-up.request';
import { AuthLoginRESP } from './response/login.response';
import { AuthSignUpRESP } from './response/sign-up.response';
import { TokenRESP } from './response/token.response';
import { JwtPayload } from './strategies/auth-jwt-at.strategy';
import { PayloadSocial } from './types/payload-social.type';

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
    const payloadSocial = {
      socialId: payload.sub,
      fullName: payload.name,
      email: payload.email,
      avatar: payload.picture,
    } as PayloadSocial;
    const data = await this.loginSocialFlow(payloadSocial, socialApp);
    return data;
  }

  async loginFacebook(accessToken: string, socialApp: SOCIAL_APP) {
    this.logger.log(`Login With Social from ${socialApp}`);
    let payload = null;
    try {
      const res = await axios({
        url: URL_GET_PROFILE_FACEBOOK(accessToken),
        method: AxiosType.GET,
      });
      payload = res.data;
    } catch (error) {
      throw new UnauthorizedException('Đăng nhập thất bại!');
    }
    const payloadSocial = {
      socialId: payload.id,
      fullName: payload.name,
      email: payload.email,
      avatar: payload.picture.data.url,
    } as PayloadSocial;
    const data = await this.loginSocialFlow(payloadSocial, socialApp);
    return data;
  }

  async loginSocialFlow(payload: PayloadSocial, socialApp: SOCIAL_APP) {
    const { socialId, fullName, email, avatar } = payload;
    const socialProvider = { socialId, socialApp } as SocialProvider;
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      const dataToCreate = { socialProviders: [socialProvider], email, fullName, avatar };
      const newUser = await this.userService.createUserSocial(dataToCreate);
      return await this.login(newUser);
    } else {
      const isInclude = isArrayIncludeObject(user.socialProviders, socialProvider);
      if (!isInclude) {
        await this.userModel.findByIdAndUpdate(user._id, { $push: { socialProviders: socialProvider } });
      }
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
