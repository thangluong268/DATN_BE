import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ws = context.switchToWs().getClient();
    console.log(ws.handshake);
    return {
      headers: {
        authorization: `Bearer ${ws.handshake.headers.token}`,
      },
    };
  }
}
