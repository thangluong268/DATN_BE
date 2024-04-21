import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Product } from 'domains/product/schema/product.schema';
import { Promotion } from 'domains/promotion/schema/promotion.schema';
import { Report } from 'domains/report/schema/report.schema';
import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { PolicyType } from 'shared/enums/policy.enum';

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
  ) {}

  @Cron('0 * * * * *')
  onStart() {
    this.logger.log('Entry CronJobs Service starting...');
  }

  @Cron('*/1 * * * * *')
  async disableProduct() {
    await this.productModel.updateMany({ quantity: { $lte: 0 }, status: true }, { $set: { status: false } });
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async cleanupBill() {
  //   await this.billModel.deleteMany({ isPaid: false, paymentMethod: { $ne: PAYMENT_METHOD.CASH } });
  // }

  @Cron('*/1 * * * * *')
  async passEndTimePromotion() {
    await this.promotionModel.updateMany({ endTime: { $lt: new Date() }, isActive: true }, { $set: { isActive: false } });
  }

  @Cron('*/1 * * * * *')
  async usedUpPromotion() {
    await this.promotionModel.updateMany({ quantity: { $lte: 0 }, isActive: true }, { $set: { isActive: false } });
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
}
