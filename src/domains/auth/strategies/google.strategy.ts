import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from 'src/app.config';
import { SOCIAL_APP } from 'src/shared/constants/user.constant';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/login/oauth2/google',
      scope: ['email', 'profile', 'openid'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!profile || !accessToken) {
      return done('No user from google', null);
    }
    const { emails, photos, displayName } = profile;
    const user = {
      socialId: profile.id,
      email: emails[0].value,
      fullName: displayName,
      avatar: photos[0].value,
      socialApp: SOCIAL_APP.GOOGLE,
    };
    done(null, user);
  }
}
