import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NOTIFICATION_CONTENT } from 'shared/constants/notification.constant';
import { BILL_STATUS, BILL_STATUS_NOTIFICATION } from 'shared/enums/bill.enum';
import { NotificationType } from 'shared/enums/notification.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { NotificationSubjectInfoDTO } from './dto/notification-subject-info.dto';
import { NotificationReadREQ } from './request/notification-read.request';
import { NotificationUpdateREQ } from './request/notification-update.request';
import { NotificationGetRESP } from './response/notification-get.response';
import { Notification } from './schema/notification.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async getNotifications(userId: string, query: PaginationREQ) {
    this.logger.log(`Get notifications of user ${userId}`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const [data, total] = await Promise.all([
      this.notificationModel.find({ receiverId: userId }).sort({ isRead: 1, updatedAt: -1 }).limit(limit).skip(skip).lean(),
      this.notificationModel.countDocuments({ receiverId: userId }),
    ]);
    return { data: data.map((notification) => NotificationGetRESP.of(notification)), total };
  }

  async create(
    receiverId: string,
    subjectInfo: NotificationSubjectInfoDTO,
    type: NotificationType,
    link: string,
    billStatus?: BILL_STATUS | BILL_STATUS_NOTIFICATION,
  ) {
    this.logger.log(`Create notification for user ${receiverId}`);
    const typeToGetContent = billStatus ? billStatus : type;
    const content = this.getContent(typeToGetContent);
    const newNotification = await this.notificationModel.create({
      receiverId,
      subjectId: subjectInfo.subjectId,
      subjectAvatar: subjectInfo.subjectAvatar,
      subjectName: subjectInfo.subjectName,
      content,
      type,
      link,
    });
    return NotificationGetRESP.of(newNotification);
  }

  getContent(type: NotificationType | BILL_STATUS | BILL_STATUS_NOTIFICATION) {
    return `${NOTIFICATION_CONTENT[type]}`;
  }

  async readNotifications(body: NotificationReadREQ) {
    this.logger.log(`Read notifications`);
    const { notificationIds } = body;
    return await Promise.all(
      notificationIds.map(async (notificationId) => {
        const updatedNotification = await this.notificationModel.findByIdAndUpdate(
          notificationId,
          { isRead: true },
          { lean: true, new: true },
        );
        return NotificationGetRESP.of(updatedNotification);
      }),
    );
  }

  async update(body: NotificationUpdateREQ) {
    this.logger.log(`Update notification`);
    const { notificationId, ...data } = body;
    const updatedNotification = await this.notificationModel.findByIdAndUpdate(notificationId, data, { lean: true, new: true });
    return NotificationGetRESP.of(updatedNotification);
  }

  async getOne(receiverId: string, subjectId: string, type: NotificationType) {
    return await this.notificationModel.findOne({ receiverId, subjectId, type });
  }

  async countNewNotifications(userId: string) {
    this.logger.log(`Count new notifications`);
    return await this.notificationModel.countDocuments({ receiverId: userId, isRead: false });
  }
}
