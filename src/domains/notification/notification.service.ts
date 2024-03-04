import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification } from './schema/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async create(notification: CreateNotificationDto): Promise<Notification> {
    const newNotification = await this.notificationModel.create(notification);
    return newNotification;
  }

  async getAllByUserId(
    userId: string,
    pageQuery: number,
    limitQuery: number,
  ): Promise<{ total: number; notifications: Notification[] }> {
    const limit = Number(limitQuery) || Number(process.env.LIMIT_DEFAULT);
    const page = Number(pageQuery) || Number(process.env.PAGE_DEFAULT);
    const skip = limit * (page - 1);
    const total = await this.notificationModel.countDocuments({ userIdTo: userId });
    const notifications = await this.notificationModel.find({ userIdTo: userId }).sort({ updatedAt: -1 }).limit(limit).skip(skip);
    return { total, notifications };
  }

  async update(id: string, updateNoti: UpdateNotificationDto): Promise<boolean> {
    const notification = await this.notificationModel.findByIdAndUpdate(id, updateNoti);
    if (!notification) {
      return false;
    }
    return true;
  }
}
