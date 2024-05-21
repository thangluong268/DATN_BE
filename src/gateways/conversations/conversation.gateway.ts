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

import { AuthService } from 'domains/auth/auth.service';
import { AuthSocket, WsGuard } from 'domains/auth/guards/ws-jwt-auth.guard';
import { MessageService } from 'domains/message/message.service';
import { MessageCreateREQ } from 'domains/message/request/message-create.request';
import { MessageDeleteREQ } from 'domains/message/request/message-delete.request';
import { MessageIsTypingREQ } from 'domains/message/request/message-is-typing.request';
import { UserService } from 'domains/user/user.service';
import { AllExceptionsSocketFilter } from 'filter/ws-exception.filter';
import { WS_EVENT } from 'shared/constants/ws-event.constant';
import { Namespace, Socket } from 'socket.io';
import { ConversationService } from './conversation.service';
import { ConversationCountUnReadREQ } from './request/conversation-coun-unread.request';
import { ConversationGetREQ } from './request/conversation-get.request';
import { ConversationPreviewGetREQ } from './request/conversation-preview-get.request';
import { ConversationRoomREQ } from './request/conversation-room.request';

@WebSocketGateway({
  namespace: 'conversation',
})
@UseFilters(new AllExceptionsSocketFilter())
@UseGuards(WsGuard)
export class ConversationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ConversationGateway.name);
  private readonly userSocketMap = new Map<string, Socket>();
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @WebSocketServer() io: Namespace;

  afterInit() {
    this.logger.log(`Websocket Gateway initialized.`);
    // client.use(SocketAuthMiddleware(this.jwtService) as any);
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.JOIN_ROOM)
  async joinRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationRoomREQ) {
    this.logger.log(`User ${client.userId} and user ${body.receiverId} joined rom`);
    const conversation = await this.conversationService.findOneByParticipants(client.userId, body);
    client.join(conversation._id);
    this.io.emit(
      WS_EVENT.CONVERSATION.JOIN_ROOM,
      `User ${client.userId} and user ${body.receiverId} joined rom: ${conversation._id}`,
    );
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.LEAVE_ROOM)
  async leaveRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationRoomREQ) {
    this.logger.log(`User ${client.userId} and user ${body.receiverId} have left rom`);
    const conversation = await this.conversationService.findOneByParticipants(client.userId, body);
    client.leave(conversation._id);
    this.io.emit(
      WS_EVENT.CONVERSATION.LEAVE_ROOM,
      `User ${client.userId} and user ${body.receiverId} have left rom: ${conversation._id}`,
    );
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.SEND_MESSAGE)
  async sendMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() body: MessageCreateREQ) {
    this.logger.log(`User ${client.userId} sent message: ${body.text}`);
    const userId = client.userId;
    await this.conversationService.createIfIsFirstConversation(userId, body);
    const conversation = await this.conversationService.findOneByParticipants(userId, body);
    const newMessage = await this.messageService.create(conversation._id, userId, body.text);
    await this.conversationService.updateLastMessage(conversation._id, newMessage._id, newMessage.text);
    const dataConversation = await this.messageService.findByConversationOne(userId, conversation._id);
    const dataPreview = await this.conversationService.findPreviewsOne(userId, body.senderRole);
    const receiverSocket = this.userSocketMap.get(body.receiverId);
    receiverSocket.emit(WS_EVENT.CONVERSATION.SEND_MESSAGE, { text: body.text });
    receiverSocket.emit(WS_EVENT.CONVERSATION.GET_CONVERSATION_ONE, dataConversation);
    receiverSocket.emit(WS_EVENT.CONVERSATION.GET_PREVIEW_CONVERSATIONS_ONE, dataPreview);
  }

  async sendMessageServer(userId: string, body: MessageCreateREQ) {
    this.logger.log(`User ${userId} sent message: ${body.receiverId}`);
    await this.conversationService.createIfIsFirstConversation(userId, body);
    const conversation = await this.conversationService.findOneByParticipants(userId, body);
    const newMessage = await this.messageService.create(conversation._id, userId, body.text);
    await this.conversationService.updateLastMessage(conversation._id, newMessage._id, newMessage.text);
    const dataConversation = await this.messageService.findByConversationOne(userId, conversation._id);
    const dataPreview = await this.conversationService.findPreviewsOne(userId, body.senderRole);
    const receiverSocket = this.userSocketMap.get(body.receiverId);
    receiverSocket.emit(WS_EVENT.CONVERSATION.SEND_MESSAGE, { text: body.text });
    receiverSocket.emit(WS_EVENT.CONVERSATION.GET_CONVERSATION_ONE, dataConversation);
    receiverSocket.emit(WS_EVENT.CONVERSATION.GET_PREVIEW_CONVERSATIONS_ONE, dataPreview);
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.GET_CONVERSATION)
  async getConversation(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationGetREQ): Promise<WsResponse> {
    this.logger.log(`User ${client.userId} get conversation`);
    const userId = client.userId;
    const query = { page: body.page, limit: body.limit };
    const req = { senderRole: body.senderRole, receiverId: body.receiverId, receiverRole: body.receiverRole };
    const conversation = await this.conversationService.findOneByParticipants(userId, req);
    const data = await this.messageService.findByConversation(userId, req, conversation._id, query);
    return { event: WS_EVENT.CONVERSATION.GET_CONVERSATION, data };
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.GET_PREVIEW_CONVERSATIONS)
  async getPreviewConversation(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: ConversationPreviewGetREQ,
  ): Promise<WsResponse> {
    this.logger.log(`User ${client.userId} get preview conversation`);
    const userId = client.userId;
    const { senderRole, ...query } = body;
    const data = await this.conversationService.findPreviews(userId, senderRole, query);
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
    const { isTyping, ...req } = body;
    const user = await this.userService.findById(userId);
    const conversation = await this.conversationService.findOneByParticipants(userId, req);
    client.join(conversation._id);
    client.broadcast.to(conversation._id).emit(WS_EVENT.CONVERSATION.IS_TYPING, {
      userName: user.fullName,
      isTyping: isTyping,
    });
  }

  @SubscribeMessage(WS_EVENT.CONVERSATION.COUNT_UNREAD)
  async countUnRead(@ConnectedSocket() client: AuthSocket, @MessageBody() body: ConversationCountUnReadREQ): Promise<WsResponse> {
    this.logger.log(`User ${client.userId} count unread`);
    const data = await this.conversationService.countUnRead(client.userId, body.senderRole);
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

  @UseGuards(WsGuard)
  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`WS Client with id: ${client.id} connected!`);
    const token = client.handshake.headers.authorization?.split(' ')[1];
    const userId = await this.authService.verifyToken(token);
    this.userSocketMap.set(userId, client);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected socket id: ${client.id}`);
    console.log(client['userId']);
    // this.userSocketMap.delete(client.userId);
  }
}
