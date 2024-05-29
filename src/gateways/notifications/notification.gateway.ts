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
} from '@nestjs/websockets';
import { AuthSocket, WsGuard } from 'domains/auth/guards/ws-jwt-auth.guard';

import { InjectModel } from '@nestjs/mongoose';
import { User } from 'domains/user/schema/user.schema';
import { AllExceptionsSocketFilter } from 'filter/ws-exception.filter';
import { Model } from 'mongoose';
import { WS_EVENT } from 'shared/constants/ws-event.constant';
import { NotificationType } from 'shared/enums/notification.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { JwtHelper } from 'shared/helpers/jwt.helper';
import { Namespace, Socket } from 'socket.io';
import { NotificationSubjectInfoDTO } from './dto/notification-subject-info.dto';
import { NotificationService } from './notification.service';
import { NotificationCreateREQ } from './request/notification-create.request';
import { NotificationReadREQ } from './request/notification-read.request';
import { NotificationGetRESP } from './response/notification-get.response';

@WebSocketGateway({
  namespace: 'notification',
})
@UseFilters(new AllExceptionsSocketFilter())
@UseGuards(WsGuard)
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSocketMap = new Map<string, Socket>();
  constructor(
    private readonly notificationService: NotificationService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtHelper: JwtHelper,
  ) {}

  @WebSocketServer() io: Namespace;

  afterInit() {
    this.logger.log(`Websocket Gateway initialized.`);
  }

  @SubscribeMessage(WS_EVENT.NOTIFICATION.JOIN_ROOM_NOTIFICATION)
  async joinRoom(@ConnectedSocket() client: AuthSocket) {
    this.logger.log(`User ${client.userId} joined rom`);
    const receiverSocket = this.userSocketMap.get(client.userId);
    receiverSocket?.emit(WS_EVENT.NOTIFICATION.JOIN_ROOM_NOTIFICATION, `User ${client.userId} joined rom`);
  }

  async sendNotification(receiverId: string, body: NotificationGetRESP) {
    this.logger.log(`Send notification}`);
    const receiverSocket = this.userSocketMap.get(receiverId);
    receiverSocket?.emit(WS_EVENT.NOTIFICATION.SEND_NOTIFICATION, body);
  }

  @SubscribeMessage(WS_EVENT.NOTIFICATION.SENT_ADD_FRIEND_NOTIFICATION)
  async sendAddFriendNotification(@ConnectedSocket() client: AuthSocket, body: NotificationCreateREQ) {
    this.logger.log(`Send Add Friend Notification}`);
    const userId = client.userId;
    const user = await this.userModel.findById(userId).lean();
    const subjectInfo = NotificationSubjectInfoDTO.ofUser(user);
    const receiverId = body.receiverId;
    const redirectId = userId;
    const newNotification = await this.notificationService.create(
      receiverId,
      subjectInfo,
      NotificationType.SENT_ADD_FRIEND,
      redirectId,
    );
    const receiverSocket = this.userSocketMap.get(receiverId);
    receiverSocket?.emit(WS_EVENT.NOTIFICATION.SENT_ADD_FRIEND_NOTIFICATION, newNotification);
  }

  @SubscribeMessage(WS_EVENT.NOTIFICATION.GET_NOTIFICATIONS)
  async getNotifications(@ConnectedSocket() client: AuthSocket, @MessageBody() body: PaginationREQ) {
    this.logger.log(`User ${client.userId} get notifications, with body: ${JSON.stringify(body)}`);
    const data = await this.notificationService.getNotifications(client.userId, body);
    return { event: WS_EVENT.NOTIFICATION.GET_NOTIFICATIONS, data };
  }

  @SubscribeMessage(WS_EVENT.NOTIFICATION.READ_NOTIFICATION)
  async readNotifications(@ConnectedSocket() client: AuthSocket, @MessageBody() body: NotificationReadREQ) {
    this.logger.log(`Read notifications`);
    const data = await this.notificationService.readNotifications(body);
    const receiverSocket = this.userSocketMap.get(client.userId);
    receiverSocket?.emit(WS_EVENT.NOTIFICATION.READ_NOTIFICATION, data);
  }

  @SubscribeMessage(WS_EVENT.NOTIFICATION.COUNT_NEW_NOTIFICATIONS)
  async countNewNotifications(@ConnectedSocket() client: AuthSocket) {
    this.logger.log(`Count new notifications`);
    const data = await this.notificationService.countNewNotifications(client.userId);
    return { event: WS_EVENT.NOTIFICATION.COUNT_NEW_NOTIFICATIONS, data };
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`WS Client with id: ${client.id} connected!`);
    const token = client.handshake.auth.authorization;
    if (!token) return;
    const payload = this.jwtHelper.decode(token);
    this.userSocketMap.set(payload.userId, client);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Disconnected socket id: ${client.id}`);
  }
}
