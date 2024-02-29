import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, HOST_URL } from 'app.config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { SOCIAL_APP } from 'shared/constants/user.constant';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${HOST_URL}/api/auth/login/oauth2/google`,
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
