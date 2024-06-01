import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { JWT_ACCESS_TOKEN_SECRET } from 'app.config';
import { User } from 'domains/user/schema/user.schema';
import { NextFunction, Request, Response } from 'express';
import { Model } from 'mongoose';

@Injectable()
export class CheckLoginMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly jwtService: JwtService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return next();
      }
      const token = authorizationHeader.split(' ')[1];
      const payload = await this.jwtService.verifyAsync(token, { secret: JWT_ACCESS_TOKEN_SECRET });
      const user = await this.userModel.findById(payload.userId).lean();
      if (user.status === false) throw new ForbiddenException('Tài khoản của bạn đã bị vô hiệu hóa!');
      req['user'] = payload;
      next();
    } catch (error) {
      next(error);
    }
  }
}
