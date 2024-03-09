import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_ACCESS_TOKEN_SECRET } from 'app.config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CheckLoginMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return next();
      }
      const token = authorizationHeader.split(' ')[1];
      const payload = await this.jwtService.verifyAsync(token, { secret: JWT_ACCESS_TOKEN_SECRET });
      req['user'] = payload;
      next();
    } catch (error) {
      next(error);
    }
  }
}
