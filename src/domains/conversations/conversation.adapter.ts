import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SocketIoAdapter.name);
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const cors = {
      origin: '*',
    };
    this.logger.log('Configuring SocketIO server with custom CORS options');

    const optionsWithCORS: ServerOptions = {
      ...options,
      cors,
    };

    return super.createIOServer(port, optionsWithCORS);
  }
}
