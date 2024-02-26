import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JWT_ACCESS_TOKEN_SECRET } from '../../../app.config';
import { UserService } from '../../../domains/user/user.service';
import { JwtPayload } from '../strategies/auth-jwt-at.strategy';

export interface AuthSocket extends Socket {
  userId: string;
}

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean | any> {
    if (context.getType() !== 'ws') {
      return true;
    }
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    const jwtPayLoad = (await this.jwtService.verifyAsync(token, {
      secret: JWT_ACCESS_TOKEN_SECRET,
    })) as JwtPayload;

    const user = await this.userService.findById(jwtPayLoad.userId);
    if (!user) {
      return false;
    }

    client['userId'] = user._id.toString();

    return true;
  }
}
