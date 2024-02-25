import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET } from 'src/app.config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/login/facebook',
      scope: ['email'],
      profileFields: [
        'emails',
        'name',
        'picture.type(large)',
        'location',
        'birthday',
        'displayName',
        'gender',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    console.log(accessToken);
    console.log(profile);
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    };
    const payload = {
      user,
      accessToken,
    };

    done(null, payload);
  }
}
