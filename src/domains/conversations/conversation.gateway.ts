import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';

import { AllExceptionsSocketFilter } from 'filter/ws-exception.filter';
import { WS_EVENT } from 'shared/constants/ws-event.constant';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { Namespace, Socket } from 'socket.io';
import { AuthSocket, WsGuard } from '../auth/guards/ws-jwt-auth.guard';
import { MessageService } from '../message/message.service';
import { MessageCreateREQ } from '../message/request/message-create.request';
import { MessageDeleteREQ } from '../message/request/message-delete.request';
import { MessageIsTypingREQ } from '../message/request/message-is-typing.request';
import { UserService } from '../user/user.service';
import { ConversationService } from './conversation.service';
import { ConversationGetREQ } from './request/conversation-get.request';

@WebSocketGateway({
  namespace: 'conversation',
})
@UseFilters(new AllExceptionsSocketFilter())
@UseGuards(WsGuard)
export class ConversationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ConversationGateway.name);
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer() io: Namespace;

  afterInit() {
    this.logger.log(`Websocket Gateway initialized.`);
    // client.use(SocketAuthMiddleware(this.jwtService) as any);
  }

  @SubscribeMessage(WS_EVENT.SEND_MESSAGE)
  async sendMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageCreateREQ) {
    const { text, receiverId } = body;
    const userId = client.userId;
    await this.conversationService.createIfIsFirstConversation(userId, receiverId);
    const conversation = await this.conversationService.findOneByParticipants(userId, receiverId);
    await this.messageService.create(conversation._id, userId, text);
    await this.conversationService.updateLastMessage(conversation._id, userId, text);
    this.io.to(conversation._id).emit(WS_EVENT.SEND_MESSAGE, text);
  }

  @SubscribeMessage(WS_EVENT.GET_CONVERSATION)
  async getConversation(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationGetREQ): Promise<WsResponse> {
    const userId = client.userId;
    const { receiverId, ...query } = body;
    const conversation = await this.conversationService.findOneByParticipants(userId, receiverId);
    const data = await this.messageService.findByConversation(userId, conversation._id, query);
    return { event: WS_EVENT.GET_CONVERSATION, data };
  }

  @SubscribeMessage(WS_EVENT.GET_PREVIEW_CONVERSATIONS)
  async getPreviewConversation(@ConnectedSocket() client: AuthSocket, @MessageBody() body: PaginationREQ): Promise<WsResponse> {
    const userId = client.userId;
    const data = await this.conversationService.findPreviews(userId, body);
    return { event: WS_EVENT.GET_PREVIEW_CONVERSATIONS, data };
  }

  @SubscribeMessage(WS_EVENT.DELETE_MESSAGE)
  async deleteMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageDeleteREQ) {
    const userId = client.userId;
    const deletedMessage = await this.messageService.delete(userId, body.messageId);
    this.io.to(deletedMessage.conversationId).emit(WS_EVENT.DELETE_MESSAGE, deletedMessage.id);
  }

  @SubscribeMessage(WS_EVENT.IS_TYPING)
  async isTyping(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageIsTypingREQ) {
    const userId = client.userId;
    const user = await this.userService.findById(userId);
    const conversation = await this.conversationService.findOneByParticipants(userId, body.receiverId);
    client.broadcast.to(conversation._id).emit(WS_EVENT.IS_TYPING, {
      userName: user.fullName,
      isTyping: body.isTyping,
    });
  }

  // @SubscribeMessage(WS_EVENT.IS_ONLINE)
  // async isOnline(
  //   @ConnectedSocket() client: AuthSocket,
  //   @MessageBody('isOnline') isOnline: boolean,
  // ) {
  //   const userId = client.userId;
  //   const user = await this.userService.findById(userId);
  //   const conversation = await this.conversationService.findOneByParticipants(
  //     userId,
  //     body.receiverId,
  //   );
  //   client.broadcast.to(conversation._id).emit(WS_EVENT.IS_TYPING, {
  //     userName: user.fullName,
  //     isTyping: body.isTyping,
  //   });
  // }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`WS Client with id: ${client.id} connected!`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected socket id: ${client.id}`);
  }
}
