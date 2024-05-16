import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'domains/user/schema/user.schema';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { JWT_ACCESS_TOKEN_SECRET } from '../../../app.config';
import { JwtPayload } from '../strategies/auth-jwt-at.strategy';

export interface AuthSocket extends Socket {
  userId: string;
}

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean | any> {
    if (context.getType() !== 'ws') {
      return true;
    }
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.authorization?.split(' ')[1];
    console.log(token);

    if (!token) {
      return false;
    }

    const jwtPayLoad = (await this.jwtService.verifyAsync(token, {
      secret: JWT_ACCESS_TOKEN_SECRET,
    })) as JwtPayload;

    const user = await this.userModel.findById(jwtPayLoad.userId).lean();
    if (!user) {
      return false;
    }

    client['userId'] = user._id.toString();

    return true;
  }
}
