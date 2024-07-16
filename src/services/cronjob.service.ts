import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TAX_RATE } from 'app.config';
import axios from 'axios';
import * as dayjs from 'dayjs';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Cart } from 'domains/cart/schema/cart.schema';
import { Category } from 'domains/category/schema/category.schema';
import { Feedback } from 'domains/feedback/schema/feedback.schema';
import { Finance } from 'domains/finance/schema/finance.schema';
import { Product } from 'domains/product/schema/product.schema';
import { Promotion } from 'domains/promotion/schema/promotion.schema';
import { Report } from 'domains/report/schema/report.schema';
import { StoreWallet } from 'domains/store-wallet/schema/store-wallet.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Tax } from 'domains/tax/schema/tax.schema';
import { UserBillTracking } from 'domains/user-bill-tracking/schema/user-bill-tracking.schema';
import { User } from 'domains/user/schema/user.schema';
import { NotificationSubjectInfoDTO } from 'gateways/notifications/dto/notification-subject-info.dto';
import { NotificationGateway } from 'gateways/notifications/notification.gateway';
import { NotificationService } from 'gateways/notifications/notification.service';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { CLASSIFY_FEEDBACK_API } from 'shared/apis/classify-feedbacl.api';
import { CLOUDINARY_PUBLIC_IDs_FIXED } from 'shared/constants/cloudinary.constant';
import { CONTENT_REPORT_FEEDBACK, RESULT_FROM_TRAIN_FEEDBACK } from 'shared/constants/common.constant';
import { NOTIFICATION_LINK } from 'shared/constants/notification.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { CloudinaryDestroyType, CloudinaryFolder } from 'shared/enums/cloudinary.enum';
import { AxiosType } from 'shared/enums/common.enum';
import { NotificationType } from 'shared/enums/notification.enum';
import { PolicyType } from 'shared/enums/policy.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { MailService } from './mail/mail.service';
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

    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,

    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,

    @InjectModel(StoreWallet.name)
    private readonly storeWalletModel: Model<StoreWallet>,

    private readonly redisService: RedisService,

    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,

    private readonly mailService: MailService,

    private readonly cloudinaryService: CloudinaryService,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
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
  async clearProductInactiveInCart() {
    const products = await this.productModel.find({ status: false }).select('_id').lean();
    const productIds = products.map((product) => product._id);
    if (productIds.length === 0) return;
    await this.cartModel.updateMany({ 'products.id': { $in: productIds } }, { $pull: { products: { id: { $in: productIds } } } });
  }

  @Cron('*/1 * * * * *')
  async updateTotalPriceInCart() {
    const carts = await this.cartModel.find().lean();
    if (carts.length === 0) return;
    for (const cart of carts) {
      const newTotalPrice = cart.products.reduce((total, product) => total + product.newPrice * product.quantity, 0);
      await this.cartModel.findByIdAndUpdate(cart._id, { totalPrice: newTotalPrice });
    }
  }

  @Cron('*/1 * * * * *')
  async cleanCart() {
    const carts = await this.cartModel
      .find({ products: { $size: 0 } })
      .select('_id')
      .lean();
    if (carts.length === 0) return;
    const cartIds = carts.map((cart) => cart._id);
    await this.cartModel.deleteMany({ _id: { $in: cartIds } });
  }

  @Cron('*/1 * * * * *')
  async passEndTimePromotion() {
    await this.promotionModel.updateMany({ endTime: { $lt: new Date() }, isActive: true }, { $set: { isActive: false } });
  }

  @Cron('*/1 * * * * *')
  async usedUpPromotion() {
    const promotions = await this.promotionModel.find({ isActive: true }).lean();
    for (const promotion of promotions) {
      if (promotion.userUses.length === promotion.quantity) {
        await this.promotionModel.findByIdAndUpdate(promotion._id, { isActive: false });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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
    // send mail when ban user
    const users = await this.userModel.find({ warningCount: { $gte: 3 }, role: { $nin: [ROLE_NAME.SHIPPER] } }).lean();
    for (const user of users) {
      await this.userModel.findByIdAndUpdate(user._id, { status: false });
      this.mailService.sendBanUser(user.email);
    }
  }

  @Cron('*/1 * * * * *')
  async handleUnBanUser() {
    await this.userModel.updateMany(
      { warningCount: { $lt: 3 }, role: { $nin: [ROLE_NAME.SHIPPER] } },
      { $set: { status: true } },
    );
  }

  @Cron('*/1 * * * * *')
  async handleBanStore() {
    await this.storeModel.updateMany({ warningCount: { $gte: 3 } }, { $set: { status: false } });
  }

  @Cron('*/1 * * * * *')
  async handleUnBanStore() {
    await this.storeModel.updateMany({ warningCount: { $lt: 3 } }, { $set: { status: true } });
  }

  @Cron(CronExpression.EVERY_MINUTE)
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
        await this.storeWalletModel.updateOne({ storeId: bill.storeId }, { $inc: { wallet: totalPrice } });
      }),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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

  /**
   *
   * 1. Shipper has already confirmed delivery
   * 2. If user not confirm delivery after 1 days, system will auto confirm delivery
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async confirmedBill() {
    const now = dayjs();
    const oneDayAgo = now.subtract(1, 'day').toDate();
    const bills = await this.billModel
      .find({
        updatedAt: { $lt: oneDayAgo },
        status: BILL_STATUS.DELIVERING,
        isShipperConfirmed: true,
        isUserConfirmed: false,
      })
      .lean();
    if (bills.length === 0) return;
    const billIds = bills.map((bill) => bill._id);
    await this.billModel.updateMany(
      { _id: { $in: billIds } },
      {
        status: BILL_STATUS.DELIVERED,
        isUserConfirmed: true,
        processDate: new Date(),
      },
    );
  }

  /**
   *
   * 1. If shipper not confirm to active the account after 7 days, system will auto delete the account
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteShipperAccount() {
    const now = dayjs();
    const sevenDayAgo = now.subtract(7, 'day').toDate();
    const shippers = await this.userModel
      .find({ createdAt: { $lt: sevenDayAgo }, role: ROLE_NAME.SHIPPER, status: false })
      .lean();
    if (shippers.length === 0) return;
    const shipperIds = shippers.map((shipper) => shipper._id);
    await this.userModel.deleteMany({ _id: { $in: shipperIds } });
  }

  /**
   * Scan feedback
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async scanFeedback() {
    const feedbacks = await this.feedbackModel.find({ isScan: false }).lean();
    if (feedbacks.length === 0) return;
    const admin = await this.userModel.findOne({ role: ROLE_NAME.ADMIN }).lean();
    const adminId = admin._id.toString();
    for (const feedback of feedbacks) {
      try {
        const res = await axios({
          url: CLASSIFY_FEEDBACK_API,
          method: AxiosType.POST,
          data: { text: feedback.content },
        });
        const result = res.data;
        if (result === RESULT_FROM_TRAIN_FEEDBACK.NEGATIVE) {
          const isFirstFeedback =
            (await this.feedbackModel.countDocuments({ userId: feedback.userId, productId: feedback.productId })) === 1;
          this.reportModel.create({
            userId: adminId,
            subjectId: feedback.userId,
            content: CONTENT_REPORT_FEEDBACK,
            type: PolicyType.USER,
            status: true,
          });
          isFirstFeedback
            ? await this.userModel.findByIdAndUpdate(feedback.userId, { $inc: { warningCount: 1, wallet: -100 } })
            : await this.userModel.findByIdAndUpdate(feedback.userId, { $inc: { warningCount: 1 } });
          await this.feedbackModel.findByIdAndDelete(feedback._id);

          const product = await this.productModel.findById(feedback.productId).lean();
          // Send notification
          const subjectInfo = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar[0]);
          const receiverId = feedback.userId;
          const link = NOTIFICATION_LINK[NotificationType.FEEDBACK] + product._id.toString();
          const notification = await this.notificationService.create(
            receiverId,
            subjectInfo,
            NotificationType.REPORT_FEEDBACK,
            link,
          );
          this.notificationGateway.sendNotification(receiverId, notification);
        } else {
          await this.feedbackModel.findByIdAndUpdate(feedback._id, { isScan: true });
        }
      } catch (e) {
        console.log(e.message);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanCloudinary() {
    const condition = { avatar: { $exists: true, $regex: '^(http://res.cloudinary.com|https://res.cloudinary.com)' } };
    const products = await this.productModel.find(condition).select('avatar').lean();
    const stores = await this.storeModel.find(condition).select('avatar').lean();
    const users = await this.userModel.find(condition).select('avatar').lean();

    const avatarsProduct = products.flatMap((product) => product.avatar);
    const avatarsStore = stores.flatMap((store) => store.avatar);
    const avatarsUser = users.flatMap((user) => user.avatar);
    const avatarUrls = [...avatarsProduct, ...avatarsStore, ...avatarsUser];

    const publicIdsExtract = this.cloudinaryService.extractPublicIdFromURLs(avatarUrls, CloudinaryFolder.DATN2024);
    const publicIdsServer = [...publicIdsExtract, ...CLOUDINARY_PUBLIC_IDs_FIXED];
    const publicIdsCloudinary = await this.cloudinaryService.getPublicIdsInFolder(CloudinaryFolder.DATN2024);
    const publicIds = publicIdsCloudinary.filter((publicId) => !publicIdsServer.includes(publicId));

    if (publicIds.length === 0) return;
    for (const publicId of publicIds) {
      this.cloudinaryService.destroyFile(publicId, CloudinaryDestroyType.IMAGE);
    }
  }
}
