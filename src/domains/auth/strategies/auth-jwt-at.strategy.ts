import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JWT_ACCESS_TOKEN_SECRET } from 'app.config';
import { UserService } from 'domains/user/user.service';
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';

export interface JwtPayload {
  userId: string;
}

@Injectable()
export class JwtATStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: JWT_ACCESS_TOKEN_SECRET,
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Không có quyền truy cập!');
    }
    return {
      _id: user._id,
      role: user.role,
    };
  }
}

const extractJwtFromCookie: JwtFromRequestFunction = (request) => {
  return request.signedCookies['token']!;
};
