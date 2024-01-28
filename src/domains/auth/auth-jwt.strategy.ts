// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { JWT_SECRET_KEY } from 'src/app.config';
// import { AuthJwtPayloadDTO } from './dto/auth-jwt-payload.dto';
// import { AuthUserDTO } from './dto/auth-user.dto';

// @Injectable()
// export class AuthJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: JWT_SECRET_KEY,
//       ignoreExpiration: false,
//       passReqToCallback: false,
//     });
//   }

//   async validate(payload: AuthJwtPayloadDTO): Promise<AuthUserDTO> {
//     const account = await this.prismaService.account.findUniqueOrThrow({
//       where: { id: Number(payload.sub) },
//       select: {
//         id: true,
//         username: true,
//         accountType: true,
//         administrator: { select: { id: true } },
//         businessManager: { select: { id: true, businessId: true } },
//         siteManager: {
//           select: {
//             id: true,
//             siteId: true,
//             site: { select: { businessId: true } },
//           },
//         },
//       },
//     });
//     return AuthUserDTO.fromEntity(account as any);
//   }
// }
