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

import { AuthSocket, WsGuard } from 'domains/auth/guards/ws-jwt-auth.guard';
import { MessageService } from 'domains/message/message.service';
import { MessageCreateREQ } from 'domains/message/request/message-create.request';
import { MessageDeleteREQ } from 'domains/message/request/message-delete.request';
import { MessageIsTypingREQ } from 'domains/message/request/message-is-typing.request';
import { UserService } from 'domains/user/user.service';
import { AllExceptionsSocketFilter } from 'filter/ws-exception.filter';
import { WS_EVENT } from 'shared/constants/ws-event.constant';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { Namespace, Socket } from 'socket.io';
import { ConversationService } from './conversation.service';
import { ConversationGetREQ } from './request/conversation-get.request';
import { ConversationJoinRoomREQ } from './request/conversation-join-room.request';
import { ConversationLeaveRoomREQ } from './request/conversation-leave-room.request';

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

  @SubscribeMessage(WS_EVENT.CONVERSATION.JOIN_ROOM)
  async joinRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationJoinRoomREQ) {
    this.logger.log(`User ${client.userId} and user ${body.receiverId} joined rom`);
    const conversation = await this.conversationService.findOneByParticipants(client.userId, body.receiverId);
    client.join(conversation._id);
    this.io.emit(
      WS_EVENT.CONVERSATION.JOIN_ROOM,
      `User ${client.userId} and user ${body.receiverId} joined rom: ${conversation._id}`,
    );
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.LEAVE_ROOM)
  async leaveRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationLeaveRoomREQ) {
    this.logger.log(`User ${client.userId} and user ${body.receiverId} have left rom`);
    const conversation = await this.conversationService.findOneByParticipants(client.userId, body.receiverId);
    client.leave(conversation._id);
    this.io.emit(
      WS_EVENT.CONVERSATION.LEAVE_ROOM,
      `User ${client.userId} and user ${body.receiverId} have left rom: ${conversation._id}`,
    );
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.SEND_MESSAGE)
  async sendMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageCreateREQ) {
    this.logger.log(`User ${client.userId} sent message: ${body.text}`);
    const { text, receiverId } = body;
    const userId = client.userId;
    await this.conversationService.createIfIsFirstConversation(userId, receiverId);
    const conversation = await this.conversationService.findOneByParticipants(userId, receiverId);
    const newMessage = await this.messageService.create(conversation._id, userId, text);
    await this.conversationService.updateLastMessage(conversation._id, userId, newMessage._id, newMessage.text, receiverId);
    this.io.to(conversation._id).emit(WS_EVENT.CONVERSATION.SEND_MESSAGE, text);
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.GET_CONVERSATION)
  async getConversation(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationGetREQ): Promise<WsResponse> {
    this.logger.log(`User ${client.userId} get conversation`);
    const userId = client.userId;
    const { receiverId, ...query } = body;
    const conversation = await this.conversationService.findOneByParticipants(userId, receiverId);
    const data = await this.messageService.findByConversation(userId, conversation._id, query);
    client.join(conversation._id);
    return { event: WS_EVENT.CONVERSATION.GET_CONVERSATION, data };
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.GET_PREVIEW_CONVERSATIONS)
  async getPreviewConversation(@ConnectedSocket() client: AuthSocket, @MessageBody() body: PaginationREQ): Promise<WsResponse> {
    this.logger.log(`User ${client.userId} get preview conversation`);
    const userId = client.userId;
    const data = await this.conversationService.findPreviews(userId, body);
    return { event: WS_EVENT.CONVERSATION.GET_PREVIEW_CONVERSATIONS, data };
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.DELETE_MESSAGE)
  async deleteMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageDeleteREQ) {
    this.logger.log(`User ${client.userId} delete message: ${body.messageId}`);
    const userId = client.userId;
    const deletedMessage = await this.messageService.delete(userId, body.messageId);
    client.join(deletedMessage.conversationId);
    this.io.to(deletedMessage.conversationId).emit(WS_EVENT.CONVERSATION.DELETE_MESSAGE, deletedMessage.id);
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.IS_TYPING)
  async isTyping(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageIsTypingREQ) {
    const userId = client.userId;
    const user = await this.userService.findById(userId);
    const conversation = await this.conversationService.findOneByParticipants(userId, body.receiverId);
    client.join(conversation._id);
    client.broadcast.to(conversation._id).emit(WS_EVENT.CONVERSATION.IS_TYPING, {
      userName: user.fullName,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.COUNT_UNREAD)
  async countUnRead(@ConnectedSocket() client: AuthSocket): Promise<WsResponse> {
    this.logger.log(`User ${client.userId} count unread`);
    const data = await this.conversationService.countUnRead(client.userId);
    return { event: WS_EVENT.CONVERSATION.COUNT_UNREAD, data };
  }

  // @SubscribeMessage(WS_EVENT.CONVERSATION.IS_ONLINE)
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
  //   client.broadcast.to(conversation._id).emit(WS_EVENT.CONVERSATION.IS_TYPING, {
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
