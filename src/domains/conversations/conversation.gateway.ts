import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Namespace, Socket } from 'socket.io';
import { AllExceptionsSocketFilter } from 'src/filter/ws-exception.filter';
import { JwtHelper } from 'src/shared/helpers/jwt.helper';
import { MessageService } from '../message/message.service';
import { MessageCreateREQ } from '../message/request/message-create.request';

@WebSocketGateway({
  namespace: 'conversation',
})
@UseFilters(new AllExceptionsSocketFilter())
export class ConversationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ConversationGateway.name);
  constructor(
    private readonly messageService: MessageService,
    private readonly jwtHelper: JwtHelper,
  ) {}

  @WebSocketServer() io: Namespace;

  afterInit(): void {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  @SubscribeMessage('message')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: MessageCreateREQ,
  ) {
    const auth = this.jwtHelper.decode(`${client.handshake.headers.token}`);
    const userId = auth.userId;
    await this.messageService.create(userId, body);
    console.log(body.text);
    this.io.emit('message', body.text);
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`WS Client with id: ${client.id} connected!`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected socket id: ${client.id}`);
  }
}
