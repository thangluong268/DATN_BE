import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, HOST } from 'app.config';
import { Strategy } from 'passport-facebook';
import { SOCIAL_APP } from 'shared/constants/user.constant';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      callbackURL: `${HOST}/api/auth/login/facebook/redirect`,
      scope: ['email'],
      profileFields: ['emails', 'name', 'picture.type(large)', 'birthday', 'displayName', 'gender'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    if (!profile || !accessToken) {
      const errorMessage = new Error('No user from facebook');
      return done(errorMessage, null);
    }
    const { id, displayName, gender, _json, emails } = profile;
    const user = {
      socialId: id,
      email: emails[0].value,
      fullName: displayName,
      gender,
      birthday: new Date(_json.birthday),
      socialApp: SOCIAL_APP.FACEBOOK,
    };
    done(null, user);
  }
}
