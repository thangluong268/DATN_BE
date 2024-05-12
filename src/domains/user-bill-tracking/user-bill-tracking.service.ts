import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Model } from 'mongoose';
import {
  BILL_STATUS_TRANSLATE_VALUE,
  NUM_OF_BAN_VALUE_BY_STATUS,
  NUM_OF_DAY_USER_NOT_ALLOW_DO_BEHAVIOR,
  NUM_OF_DAY_USER_NOT_ALLOW_USE_VOUCHER,
} from 'shared/constants/bill.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { UserBillTracking } from './schema/user-bill-tracking.schema';

@Injectable()
export class UserBillTrackingService {
  constructor(
    @InjectModel(UserBillTracking.name)
    private readonly userBillTrackingModel: Model<UserBillTracking>,
  ) {}

  async handleUserBillTracking(userId: string, status: BILL_STATUS) {
    const userBillTracking = await this.userBillTrackingModel.findOneAndUpdate(
      { userId },
      { $inc: { numOfRefund: 1 }, status },
      { upsert: true, new: true },
    );
    if (userBillTracking.bannedDate) return;
    if (userBillTracking.numOfBehavior >= NUM_OF_BAN_VALUE_BY_STATUS[status]) {
      userBillTracking.bannedDate = new Date();
    }
    await userBillTracking.save();
  }

  async checkUserNotAllowDoBehavior(userId: string, status: BILL_STATUS) {
    const userBillTracking = await this.userBillTrackingModel.findOne({ userId, status, bannedDate: { $ne: null } }).lean();
    if (userBillTracking)
      throw new BadRequestException(
        `Bạn không thể ${BILL_STATUS_TRANSLATE_VALUE[status]} trong vòng ${NUM_OF_DAY_USER_NOT_ALLOW_DO_BEHAVIOR - dayjs(new Date()).diff(userBillTracking.bannedDate, 'day')} ngày !`,
      );
  }

  async checkUserNotAllowUseVoucher(userId: string) {
    const userTracking = await this.userBillTrackingModel
      .findOne({ userId, status: { $in: [BILL_STATUS.REFUND, BILL_STATUS.BACK] }, bannedDate: { $ne: null } })
      .lean();
    if (userTracking)
      throw new BadRequestException(
        `Bạn đã bị vô hiệu hóa sử dụng voucher trong vòng ${NUM_OF_DAY_USER_NOT_ALLOW_USE_VOUCHER - dayjs(new Date()).diff(userTracking.bannedDate, 'day')} ngày !`,
      );
  }
}
