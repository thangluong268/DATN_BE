import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NOTIFICATION_CONTENT } from 'shared/constants/notification.constant';
import { NotificationType } from 'shared/enums/notification.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { NotificationSubjectInfoDTO } from './dto/notification-subject-info.dto';
import { NotificationUpdateREQ } from './request/notification-update.request';
import { NotificationGetRESP } from './response/notification-get.response';
import { Notification } from './schema/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async getNotifications(userId: string, query: PaginationREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const [data, total] = await Promise.all([
      this.notificationModel.find({ receiverId: userId }).sort({ isRead: 1, updatedAt: -1 }).limit(limit).skip(skip).lean(),
      this.notificationModel.countDocuments({ receiverId: userId }),
    ]);
    return { data: data.map((notification) => NotificationGetRESP.of(notification)), total };
  }

  async create(receiverId: string, subjectInfo: NotificationSubjectInfoDTO, type: NotificationType, redirectId?: string) {
    const content = this.getContent(type);
    const newNotification = await this.notificationModel.create({
      receiverId,
      subjectId: subjectInfo.subjectId,
      subjectAvatar: subjectInfo.subjectAvatar,
      subjectName: subjectInfo.subjectName,
      content,
      type,
      redirectId,
    });
    return NotificationGetRESP.of(newNotification);
  }

  getContent(type: NotificationType, sub?: any) {
    // sub là tên sản phẩm
    /**
     * NEW_POST: sub là tên sản phẩm
     * BILL: sub là trạng thái đơn hàng
     * EVALUATION: sub là emoji
     */
    switch (type) {
      case NotificationType.UPDATE_INFO:
      case NotificationType.FOLLOW:
      case NotificationType.SENT_ADD_FRIEND:
      case NotificationType.ACCEPTED_ADD_FRIEND_OF_SENDER:
      case NotificationType.ACCEPTED_ADD_FRIEND_OF_RECEIVER:
      case NotificationType.REJECT_ADD_FRIEND:
      case NotificationType.FEEDBACK:
        return NOTIFICATION_CONTENT[type];
      case NotificationType.NEW_POST:
      case NotificationType.BILL:
      case NotificationType.EVALUATION:
        return `${NOTIFICATION_CONTENT[type]} ${sub}.`;
      default:
        return '';
    }
  }

  async update(body: NotificationUpdateREQ) {
    const { notificationId, ...data } = body;
    const updatedNotification = await this.notificationModel.findByIdAndUpdate(
      notificationId,
      { ...data },
      { lean: true, new: true },
    );
    return NotificationGetRESP.of(updatedNotification);
  }

  async getOne(receiverId: string, subjectId: string, type: NotificationType) {
    return await this.notificationModel.findOne({ receiverId, subjectId, type });
  }
}
