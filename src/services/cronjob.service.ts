import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { TAX_RATE } from 'app.config';
import * as dayjs from 'dayjs';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Finance } from 'domains/finance/schema/finance.schema';
import { Product } from 'domains/product/schema/product.schema';
import { Promotion } from 'domains/promotion/schema/promotion.schema';
import { Report } from 'domains/report/schema/report.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Tax } from 'domains/tax/schema/tax.schema';
import { UserBillTracking } from 'domains/user-bill-tracking/schema/user-bill-tracking.schema';
import { User } from 'domains/user/schema/user.schema';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { PolicyType } from 'shared/enums/policy.enum';
import { RedisService } from './redis/redis.service';

@Injectable()
export class CronjobsService {
  private readonly logger = new Logger(CronjobsService.name);
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,

    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Tax.name)
    private readonly taxModel: Model<Tax>,

    @InjectModel(UserBillTracking.name)
    private readonly userBillTrackingModel: Model<UserBillTracking>,

    @InjectModel(Finance.name)
    private readonly financeModel: Model<Finance>,

    private readonly redisService: RedisService,
  ) {}

  @Cron('0 * * * * *')
  onStart() {
    this.logger.log('Entry CronJobs Service starting...');
  }

  @Cron('*/1 * * * * *')
  async disableProduct() {
    await this.productModel.updateMany({ quantity: { $lte: 0 }, status: true }, { $set: { status: false } });
  }

  @Cron('*/1 * * * * *')
  async passEndTimePromotion() {
    await this.promotionModel.updateMany({ endTime: { $lt: new Date() }, isActive: true }, { $set: { isActive: false } });
  }

  @Cron('*/1 * * * * *')
  async usedUpPromotion() {
    await this.promotionModel.updateMany({ quantity: { $lte: 0 }, isActive: true }, { $set: { isActive: false } });
  }

  @Cron('*/1 * * * * *')
  async resetStartTimePromotion() {
    await this.promotionModel.updateMany(
      { startTime: { $lt: new Date() }, isActive: false, userUses: { $size: 0 } },
      { $set: { startTime: dayjs(new Date()).add(1, 'day'), endTime: dayjs(new Date()).add(7, 'day') } },
    );
  }

  /**
   * Handle product if store have been banned
   * Will disable all product of store if store is banned
   */
  @Cron('*/1 * * * * *')
  async handleProductIfStoreBanned() {
    const storeBannedIds = (await this.storeModel.find({ status: false }, { _id: 1 }).lean()).map((store) =>
      store._id.toString(),
    );
    await this.productModel.updateMany({ storeId: { $in: storeBannedIds }, status: true }, { $set: { status: false } });
  }

  /**
   * Handle product if store have been unbanned
   * Will enable all product of store if store is unbanned
   * Except products have quantity = 0 or have been reported
   */
  @Cron('*/1 * * * * *')
  async handleProductIfStoreUnBanned() {
    const storeActiveIds = (await this.storeModel.find({ status: true }, { _id: 1 }).lean()).map((store) => store._id.toString());
    const productReportedIds = Array.from(
      new Set([
        ...(await this.reportModel.find({ status: true, type: PolicyType.PRODUCT }, { subjectId: 1 }).lean()).map(
          (report) => new ObjectId(report.subjectId),
        ),
      ]),
    );
    await this.productModel.updateMany(
      { _id: { $nin: productReportedIds }, storeId: { $in: storeActiveIds }, status: false, quantity: { $gt: 0 } },
      { $set: { status: true } },
    );
  }

  @Cron('*/1 * * * * *')
  async handleBanUser() {
    await this.userModel.updateMany({ warningCount: { $gte: 3 } }, { $set: { status: false } });
  }

  @Cron('*/1 * * * * *')
  async handleUnBanUser() {
    await this.userModel.updateMany({ warningCount: { $lt: 3 } }, { $set: { status: true } });
  }

  @Cron('*/1 * * * * *')
  async handleBanStore() {
    await this.storeModel.updateMany({ warningCount: { $gte: 3 } }, { $set: { status: false } });
  }

  @Cron('*/1 * * * * *')
  async handleUnBanStore() {
    await this.storeModel.updateMany({ warningCount: { $lt: 3 } }, { $set: { status: true } });
  }

  @Cron('*/1 * * * * *')
  async processBill() {
    const now = dayjs();
    // const threeDaysAgo = now.subtract(3, 'day').toDate();
    const threeDaysAgo = now.subtract(1, 'minute').toDate();
    const bills = await this.billModel
      .find({ status: BILL_STATUS.DELIVERED, isSuccess: false, deliveredDate: { $lte: threeDaysAgo } })
      .lean();
    if (bills.length === 0) return;
    await Promise.all(
      bills.map(async (bill) => {
        await this.billModel.findByIdAndUpdate(bill._id, { isSuccess: true });
        const totalPrice = bill.totalPriceInit;
        const taxFee = Math.ceil(totalPrice * TAX_RATE);
        await this.taxModel.create({ storeId: bill.storeId, totalPrice, taxFee, paymentId: bill.paymentId });
        const redisClient = this.redisService.getClient();
        const data = await redisClient.get(bill.paymentId);
        if (data) {
          const { expense } = JSON.parse(data);
          await this.financeModel.create({ expense, revenue: taxFee });
          await redisClient.del(bill.paymentId);
        }
        const bonusCoins = Math.floor((bill.totalPricePayment * 0.2) / 1000);
        await this.userModel.findByIdAndUpdate(bill.userId, { $inc: { wallet: bonusCoins } });
        await this.userBillTrackingModel.deleteMany({ userId: bill.userId });
      }),
    );
  }

  @Cron('*/1 * * * * *')
  async handlePassBannedDayUserBillTracking() {
    const now = dayjs();
    const thirtyDaysAgo = now.subtract(30, 'day').toDate();
    const userBillTrackings = await this.userBillTrackingModel
      .find({
        bannedDate: { $lte: thirtyDaysAgo },
        status: { $in: [BILL_STATUS.REFUND, BILL_STATUS.BACK, BILL_STATUS.CANCELLED] },
      })
      .select('userId')
      .lean();
    if (userBillTrackings.length === 0) return;
    await this.userBillTrackingModel.deleteMany({
      userId: { $in: userBillTrackings.map((userBillTracking) => userBillTracking.userId) },
    });
  }
}
