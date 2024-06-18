export const FACEBOOK_GET_PROFILE_API = (accessToken: string) =>
  `https://graph.facebook.com/v20.0/me?fields=id,email,name,picture&access_token=${accessToken}`;
