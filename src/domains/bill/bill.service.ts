import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { URL_FE } from 'app.config';
import { Cart } from 'domains/cart/schema/cart.schema';
import { Finance } from 'domains/finance/schema/finance.schema';
import { Product } from 'domains/product/schema/product.schema';
import { Promotion } from 'domains/promotion/schema/promotion.schema';
import { Store } from 'domains/store/schema/store.schema';
import { Tax } from 'domains/tax/schema/tax.schema';
import { UserBillTrackingService } from 'domains/user-bill-tracking/user-bill-tracking.service';
import { User } from 'domains/user/schema/user.schema';
import { ConversationGateway } from 'gateways/conversations/conversation.gateway';
import { NotificationSubjectInfoDTO } from 'gateways/notifications/dto/notification-subject-info.dto';
import { NotificationGateway } from 'gateways/notifications/notification.gateway';
import { NotificationService } from 'gateways/notifications/notification.service';
import { ObjectId } from 'mongodb';
import { Connection, Model } from 'mongoose';
import { PaymentDTO } from 'payment/dto/payment.dto';
import { PaypalGateway, VNPayGateway } from 'payment/payment.gateway';
import { PaymentService } from 'payment/payment.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';
import { RedisService } from 'services/redis/redis.service';
import { NOTIFICATION_CONTENT_AUTO_BILL_SUCCESS, NOTIFICATION_LINK } from 'shared/constants/notification.constant';
import { BILL_STATUS, BILL_STATUS_NOTIFICATION, PAYMENT_METHOD, PRODUCT_TYPE } from 'shared/enums/bill.enum';
import { NotificationType } from 'shared/enums/notification.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { isBlank } from 'shared/validators/query.validator';
import { v4 as uuid } from 'uuid';
import { CartInfoDTO } from './dto/cart-info.dto';
import { getMonthRevenue } from './helper/get-month-revenue.helper';
import { BillCreateREQ } from './request/bill-create.request';
import { BillGetAllByStatusSellerREQ } from './request/bill-get-all-by-status-seller.request';
import { BillGetAllByStatusUserREQ } from './request/bill-get-all-by-status-user.request';
import { BillGetCalculateRevenueByYearREQ } from './request/bill-get-calculate-revenue-by-year.request';
import { BillGetCalculateTotalByYearREQ } from './request/bill-get-calculate-total-revenue-by-year.request';
import { BillGetCountCharityByYearREQ } from './request/bill-get-count-charity-by-year.request';
import { BillGetRevenueStoreREQ } from './request/bill-get-revenue-store.request';
import { BillGetTotalByStatusSellerREQ } from './request/bill-get-total-by-status-seller.request';
import { BillReasonREQ } from './request/bill-reason.request';
import { CountTotalByStatusInterface, CountTotalByStatusRESP } from './response/bill-count-total-by-status.response';
import { Bill } from './schema/bill.schema';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);
  constructor(
    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,

    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,

    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,

    @InjectModel(Tax.name)
    private readonly taxModel: Model<Tax>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(Finance.name)
    private readonly financeModel: Model<Finance>,

    private readonly userBillTrackingService: UserBillTrackingService,

    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,

    private readonly conversationGateway: ConversationGateway,

    private readonly paymentService: PaymentService,
    private readonly paypalPaymentService: PaypalPaymentService,
    private readonly redisService: RedisService,
  ) {
    this.paymentService.registerPaymentGateway.set(PAYMENT_METHOD.VNPAY, new VNPayGateway());
    this.paymentService.registerPaymentGateway.set(PAYMENT_METHOD.PAYPAL, new PaypalGateway(this.paypalPaymentService));
  }

  async create(userId: string, body: BillCreateREQ) {
    this.logger.log(`create bill: ${userId}`);
    let numOfCoins = 0;
    let totalPrice = 0;
    const paymentId = uuid();
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // Coins
      if (!isBlank(body.coins)) {
        const user = await this.userModel.findById(userId).lean();
        if (user.wallet < body.coins) throw new BadRequestException('Số dư xu không đủ!');
        numOfCoins = body.coins;
      }
      const expense = await this.calculateDiscount(userId, numOfCoins, body.promotionId, body.data);
      // await this.calculateTax(body.data, paymentId, session);
      const redisClient = this.redisService.getClient();
      await redisClient.set(paymentId, JSON.stringify({ numOfCoins, promotionId: body.promotionId, expense }));
      for (const cart of body.data) {
        totalPrice += cart['totalPricePayment'] + cart.deliveryFee;
        await this.billModel.create([BillCreateREQ.toCreateBill(cart, userId, body, paymentId)], { session });
      }
      console.log(totalPrice);
      if (totalPrice !== body.totalPayment) throw new BadRequestException('Tổng tiền không hợp lệ!');
      if (body.paymentMethod === PAYMENT_METHOD.CASH) {
        await session.commitTransaction();
        await this.handleBillSuccess(paymentId);
        return BaseResponse.withMessage({ urlPayment: `${URL_FE}/user/invoice` }, 'Thanh toán thành công!');
      }
      const paymentBody = { paymentId, amount: totalPrice } as PaymentDTO;
      const urlPayment = await this.paymentService.processPayment(paymentBody, body.paymentMethod);
      await session.commitTransaction();
      return BaseResponse.withMessage({ urlPayment }, 'Tạo đường link thanh toán thành công!');
    } catch (err) {
      await session.abortTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await session.endSession();
    }
  }

  async calculateDiscount(userId: string, numOfCoins: number, promotionId: string, carts: CartInfoDTO[]) {
    const coinsValue = numOfCoins; // 1 xu = 1đ
    const totalPrice = carts.reduce((acc, cart) => acc + cart.totalPrice, 0);
    const numOfStores = carts.length;
    let promotionValue = 0;
    if (promotionId) {
      const storeIds = carts.map((cart) => cart.storeId);
      const promotion = await this.promotionModel.findOne({
        _id: promotionId,
        storeIds: { $in: storeIds },
        isActive: true,
      });
      if (!promotion || !promotion?.isActive) throw new BadRequestException('Khuyến mãi không hợp lệ!');
      await this.userBillTrackingService.checkUserNotAllowUseVoucher(userId);
      promotionValue = Math.floor((totalPrice * promotion.value) / 100);
      if (promotionValue > promotion.maxDiscountValue) promotionValue = promotion.maxDiscountValue;
    }
    const discountValuePerStore = Math.floor((coinsValue + promotionValue) / numOfStores);
    let discountRemain = 0;
    for (const [index, cart] of carts.entries()) {
      if (discountValuePerStore > cart.totalPrice) {
        discountRemain += discountValuePerStore - cart.totalPrice;
        carts[index]['totalPricePayment'] = 0;
        continue;
      }
      carts[index]['totalPricePayment'] = cart.totalPrice - discountValuePerStore;
    }
    if (discountRemain > 0) {
      const numOfStore = carts.filter((cart) => cart['totalPricePayment'] > 0).length;
      const discountValuePerStore = Math.floor(discountRemain / numOfStore);
      this.calculatorDiscountRemain(carts, discountValuePerStore);
    }
    return coinsValue + promotionValue;
  }

  private calculatorDiscountRemain(carts: CartInfoDTO[], discountValuePerStore: number) {
    let discountRemain = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [index, cart] of carts.entries()) {
      if (carts[index]['totalPricePayment'] === 0) continue;
      if (discountValuePerStore > carts[index]['totalPricePayment']) {
        discountRemain += discountValuePerStore - carts[index]['totalPricePayment'];
        carts[index]['totalPricePayment'] = 0;
        continue;
      }
      carts[index]['totalPricePayment'] -= discountValuePerStore;
    }
    if (discountRemain > 0) {
      const numOfStore = carts.filter((cart) => cart['totalPricePayment'] > 0).length;
      const discountValuePerStore = Math.floor(discountRemain / numOfStore);
      this.calculatorDiscountRemain(carts, discountValuePerStore);
    }
  }

  async handleBillSuccess(paymentId: string) {
    this.logger.log(`Handle Bill Success: ${paymentId}`);
    const bills = await this.billModel.find({ paymentId }).lean();
    const userId = bills[0].userId;
    for (const bill of bills) {
      // Remove product in cart
      const productIds = bill.products.map((product) => new ObjectId(product.id));
      await this.cartModel.updateMany(
        { 'products.id': { $in: productIds } },
        { $pull: { products: { id: { $in: productIds } } } },
      );
      // Update quantity product
      for (const product of bill.products) {
        await this.productModel.findByIdAndUpdate(product.id, { $inc: { quantity: -product.quantity } });
      }
      // Update isPaid if paymentMethod is not cash
      await this.billModel.findByIdAndUpdate(bill._id, {
        isPaid: bill.paymentMethod !== PAYMENT_METHOD.CASH ? true : false,
      });

      const store = await this.storeModel.findById(bill.storeId).lean();
      const seller = await this.userModel.findById(store.userId).lean();

      // Send message to user
      if (seller._id.toString() !== bill.userId) {
        this.conversationGateway.sendMessageServer(seller._id.toString(), {
          senderRole: ROLE_NAME.SELLER,
          text: NOTIFICATION_CONTENT_AUTO_BILL_SUCCESS(store.name),
          receiverId: bill.userId,
          receiverRole: ROLE_NAME.USER,
        });
      }

      // Send notification to seller
      const product = bill.products[0];
      const subjectInfoToSeller = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
      const receiverIdToSeller = store.userId;
      const linkToSeller = NOTIFICATION_LINK[BILL_STATUS_NOTIFICATION.NEW_SELLER] + bill.storeId;
      const billStatusToSeller = BILL_STATUS_NOTIFICATION.NEW_SELLER;
      const notificationToSeller = await this.notificationService.create(
        receiverIdToSeller,
        subjectInfoToSeller,
        NotificationType.BILL,
        linkToSeller,
        billStatusToSeller,
      );
      this.notificationGateway.sendNotification(receiverIdToSeller, notificationToSeller);
    }
    const redisClient = this.redisService.getClient();
    const data = await redisClient.get(paymentId);
    if (data) {
      const { numOfCoins, promotionId } = JSON.parse(data);
      await this.userModel.findByIdAndUpdate(userId, { $inc: { wallet: -numOfCoins } });
      if (promotionId) {
        await this.promotionModel.findByIdAndUpdate(promotionId, { $pull: { userSaves: userId }, $push: { userUses: userId } });
      }
    }
    // Send notification
    const subjectProduct = bills[0].products[0];
    const subjectInfo = NotificationSubjectInfoDTO.ofProduct(subjectProduct.id, subjectProduct.name, subjectProduct.avatar);
    const receiverId = userId;
    const link = NOTIFICATION_LINK[NotificationType.BILL];
    const billStatus = BILL_STATUS.NEW;
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.BILL, link, billStatus);
    this.notificationGateway.sendNotification(receiverId, notification);
  }

  async handleBillFail(paymentId: string) {
    this.logger.log(`Handle Bill Fail: ${paymentId}`);
    await this.billModel.deleteMany({ paymentId });
    await this.taxModel.deleteMany({ paymentId });
  }

  async countTotalByStatusSeller(userId: string, year: number) {
    this.logger.log(`Count Total By Status Seller: ${userId}`);
    const store = await this.storeModel.findOne({ userId: userId.toString() }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetTotalByStatusSellerREQ.toQueryCondition(store._id, year));
    return BaseResponse.withMessage(
      Object.keys(BILL_STATUS).map((status) => CountTotalByStatusRESP.ofSeller(status, data)),
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }

  async countTotalByStatusUser(userId: string) {
    this.logger.log(`Count Total By Status User: ${userId}`);
    const [newBill, confirmed, delivering, delivered, cancelled, refund, back] = await Promise.all([
      this.billModel.countDocuments({ userId, status: BILL_STATUS.NEW }),
      this.billModel.countDocuments({ userId, status: BILL_STATUS.CONFIRMED }),
      this.billModel.countDocuments({ userId, status: BILL_STATUS.DELIVERING, isShipperConfirmed: false }),
      this.billModel.countDocuments({ userId, status: { $ne: BILL_STATUS.REFUND }, isShipperConfirmed: true }),
      this.billModel.countDocuments({ userId, status: BILL_STATUS.CANCELLED }),
      this.billModel.countDocuments({ userId, status: BILL_STATUS.REFUND }),
      this.billModel.countDocuments({ userId, status: BILL_STATUS.BACK }),
    ]);
    const data = [
      { status: BILL_STATUS.NEW, count: newBill },
      { status: BILL_STATUS.CONFIRMED, count: confirmed },
      { status: BILL_STATUS.DELIVERING, count: delivering },
      { status: BILL_STATUS.DELIVERED, count: delivered },
      { status: BILL_STATUS.CANCELLED, count: cancelled },
      { status: BILL_STATUS.REFUND, count: refund },
      { status: BILL_STATUS.BACK, count: back },
    ] as CountTotalByStatusInterface[];
    return BaseResponse.withMessage(
      data.map((item) => CountTotalByStatusRESP.ofUser(item)),
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }

  async calculateRevenueByYear(userId: string, year: number) {
    this.logger.log(`Calculate Revenue By Year: ${userId}`);
    const store = await this.storeModel.findOne({ userId: userId.toString() }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetCalculateRevenueByYearREQ.toQueryCondition(year, store._id));
    console.log(data);
    // Tạo mảng chứa 12 tháng với doanh thu mặc định là 0
    const monthlyRevenue = getMonthRevenue();
    let totalRevenue = 0;
    let minRevenue: { month: string; revenue: number } = { month: '', revenue: 0 };
    let maxRevenue: { month: string; revenue: number } = { month: '', revenue: 0 };
    data.forEach((entry: { _id: number; totalRevenue: number }) => {
      const month = entry._id;
      const revenue = entry.totalRevenue;
      monthlyRevenue[`Tháng ${month}`] = revenue;
      totalRevenue += revenue;
      if (!minRevenue || revenue < minRevenue.revenue) {
        minRevenue = { month: `Tháng ${month}`, revenue };
      }
      if (!maxRevenue || revenue > maxRevenue.revenue) {
        maxRevenue = { month: `Tháng ${month}`, revenue };
      }
    });
    const totalRevenueAllTime = await this.billModel.aggregate(
      BillGetCalculateRevenueByYearREQ.toQueryConditionForAllTime(store._id),
    );
    const res = {
      data: monthlyRevenue,
      revenueTotalAllTime: totalRevenueAllTime[0]?.totalRevenue || 0,
      revenueTotalInYear: totalRevenue,
      minRevenue,
      maxRevenue,
    };
    return BaseResponse.withMessage(res, 'Lấy doanh thu của từng tháng theo năm thành công!');
  }

  async countCharityByYear(userId: string, year: number) {
    this.logger.log(`Count Charity By Year: ${userId}`);
    const store = await this.storeModel.findOne({ userId: userId.toString() }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetCountCharityByYearREQ.toQueryCondition(store._id, year));
    const monthlyCharity = getMonthRevenue();
    let totalGive = 0;
    let minGive: { month: string; numOfGive: number } = { month: '', numOfGive: 0 };
    let maxGive: { month: string; numOfGive: number } = { month: '', numOfGive: 0 };
    data.forEach((entry: { _id: number; totalCharity: number }) => {
      const month = entry._id;
      const numOfGive = entry.totalCharity;
      monthlyCharity[`Tháng ${month}`] = numOfGive;
      totalGive += numOfGive;
      if (!minGive || numOfGive < minGive.numOfGive) {
        minGive = { month: `Tháng ${month}`, numOfGive };
      }
      if (!maxGive || numOfGive > maxGive.numOfGive) {
        maxGive = { month: `Tháng ${month}`, numOfGive };
      }
    });
    const totalAllTime = await this.billModel.aggregate(BillGetCountCharityByYearREQ.toQueryConditionForAllTime(store._id));
    const response = {
      data: monthlyCharity,
      charityTotalAllTime: totalAllTime[0]?.totalCharity || 0,
      charityTotalInYear: totalGive,
      minGive,
      maxGive,
    };
    return BaseResponse.withMessage(response, 'Lấy số lượng sản phẩm từ thiện của từng tháng theo năm thành công!');
  }

  async calculateTotalRevenueByYear(year: number) {
    this.logger.log(`Calculate Total Revenue By Year: ${year}`);
    // const data = await this.billModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryCondition(year));
    const data = await this.financeModel.aggregate([
      {
        $match: { createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } },
      },
      { $group: { _id: { $month: '$createdAt' }, totalRevenue: { $sum: '$revenue' } } },
    ]);
    const monthlyRevenue = getMonthRevenue();
    let totalRevenue = 0;
    let minRevenue: { month: string; revenue: number } = { month: '', revenue: 0 };
    let maxRevenue: { month: string; revenue: number } = { month: '', revenue: 0 };
    data.forEach((entry: { _id: number; totalRevenue: number }) => {
      const month = entry._id;
      const revenue = entry.totalRevenue;
      monthlyRevenue[`Tháng ${month}`] = revenue;
      totalRevenue += revenue;
      if (!minRevenue || revenue < minRevenue.revenue) {
        minRevenue = { month: `Tháng ${month}`, revenue };
      }
      if (!maxRevenue || revenue > maxRevenue.revenue) {
        maxRevenue = { month: `Tháng ${month}`, revenue };
      }
    });
    const revenueAllTime = await this.billModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryConditionForAllTime());
    const response = {
      data: monthlyRevenue,
      revenueTotalAllTime: revenueAllTime[0]?.totalRevenue || 0,
      revenueTotalInYear: totalRevenue,
      minRevenue,
      maxRevenue,
    };
    return BaseResponse.withMessage(response, 'Lấy tổng doanh thu của từng tháng theo năm thành công!');
  }

  async getAllByStatusUser(userId: string, query: BillGetAllByStatusUserREQ) {
    this.logger.log(`Get All By Status User: ${userId}`);
    const [data, total] = await Promise.all([
      this.billModel.aggregate(BillGetAllByStatusUserREQ.toFind(userId, query) as any),
      this.billModel.countDocuments(BillGetAllByStatusUserREQ.toCondition(userId, query)),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async getAllByStatusSeller(userId: string, query: BillGetAllByStatusSellerREQ) {
    this.logger.log(`Get All By Status Seller: ${userId}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const [data, total] = await Promise.all([
      this.billModel.aggregate(BillGetAllByStatusSellerREQ.toFind(store._id.toString(), query) as any),
      this.billModel.countDocuments(BillGetAllByStatusSellerREQ.toCount(store._id.toString(), query)),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async countTotalData() {
    this.logger.log(`Count Total Data`);
    const totalProduct = await this.productModel.countDocuments({ status: true });
    const totalStore = await this.storeModel.countDocuments({ status: true });
    const totalUser = await this.userModel.countDocuments({ status: true });
    const totalRevenue =
      (await this.financeModel.aggregate([{ $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }]))[0]?.totalRevenue || 0;
    const data = {
      totalProduct,
      totalStore,
      totalUser,
      totalRevenue,
    };
    return BaseResponse.withMessage(data, 'Lấy tổng số lượng dữ liệu thành công!');
  }

  async revenueStore(storeId: string) {
    this.logger.log(`Revenue Store: ${storeId}`);
    const totalRevenueAllTime = await this.billModel.aggregate(BillGetRevenueStoreREQ.toQueryRevenueAllTime(storeId));
    const totalDelivered = await this.billModel.countDocuments({ storeId, status: BILL_STATUS.DELIVERED, isSuccess: true });
    return BaseResponse.withMessage(
      { totalRevenue: totalRevenueAllTime[0]?.totalRevenue || 0, totalDelivered },
      'Lấy dữ liệu thành công!',
    );
  }

  async updateStatusBillSeller(billId: string, status: BILL_STATUS) {
    this.logger.log(`Update Status Bill Seller: ${billId}`);
    const bill = await this.billModel.findById(billId).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (![BILL_STATUS.CONFIRMED].includes(status)) throw new BadRequestException('Trạng thái không hợp lệ!');
    const updatedBill = await this.billModel.findByIdAndUpdate({ _id: billId }, { status }, { new: true });
    switch (status) {
      case BILL_STATUS.CONFIRMED:
        // Send notification to user
        const product = bill.products[0];
        const subjectInfo = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
        const receiverId = bill.userId;
        const link = NOTIFICATION_LINK[NotificationType.BILL];
        const billStatus = BILL_STATUS.CONFIRMED;
        const notification = await this.notificationService.create(
          receiverId,
          subjectInfo,
          NotificationType.BILL,
          link,
          billStatus,
        );
        this.notificationGateway.sendNotification(receiverId, notification);
        break;
      default:
        break;
    }
    updatedBill.save();
    return BaseResponse.withMessage({}, 'Cập nhật trạng thái đơn hàng thành công!');
  }

  async countProductDelivered(productId: string, type: PRODUCT_TYPE, status: BILL_STATUS) {
    return await this.billModel.countDocuments({
      products: { $elemMatch: { id: productId.toString(), type } },
      status,
      isSuccess: true,
    });
  }

  async checkProductPurchased(productId: string) {
    const bill = await this.billModel.findOne({ products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async calculateRevenueAllTimeByStoreId(storeId: string) {
    const result = await this.billModel.aggregate([
      { $match: { status: BILL_STATUS.DELIVERED, isSuccess: true, storeId: storeId.toString() } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPriceInit' } } },
    ]);
    return result[0]?.totalRevenue || 0;
  }

  async cancelBillByUser(userId: string, billId: string, body: BillReasonREQ) {
    this.logger.log(`Cancel Bill: ${billId} By User: ${userId}`);
    const bill = await this.billModel.findOne({ _id: new ObjectId(billId), userId }).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (bill.status !== BILL_STATUS.NEW) throw new BadRequestException('Không thể hủy đơn hàng này!');
    await this.userBillTrackingService.checkUserNotAllowDoBehavior(userId, BILL_STATUS.CANCELLED);
    await this.handleCancelBill(bill, body.reason);
    await this.userBillTrackingService.handleUserBillTracking(bill._id, userId, BILL_STATUS.CANCELLED);

    // Send notification
    const product = bill.products[0];
    const subjectInfo = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
    const receiverId = userId;
    const link = NOTIFICATION_LINK[NotificationType.BILL];
    const billStatus = BILL_STATUS.CANCELLED;
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.BILL, link, billStatus);
    this.notificationGateway.sendNotification(receiverId, notification);
    return BaseResponse.withMessage({}, 'Hủy đơn hàng thành công!');
  }

  async cancelBillBySeller(userId: string, billId: string, body: BillReasonREQ) {
    this.logger.log(`Cancel Bill: ${billId} By Seller: ${userId}`);
    const store = await this.storeModel.findOne({ userId: userId.toString() }).lean();
    if (!store) throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này!');
    const bill = await this.billModel.findOne({ _id: new ObjectId(billId), storeId: store._id.toString() }).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (bill.status !== BILL_STATUS.NEW && bill.status !== BILL_STATUS.CONFIRMED)
      throw new BadRequestException('Không thể hủy đơn hàng này!');
    await this.handleCancelBill(bill, body.reason);

    // Send notification
    const product = bill.products[0];
    const subjectInfo = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
    const receiverId = bill.userId;
    const link = NOTIFICATION_LINK[NotificationType.BILL];
    const billStatus = BILL_STATUS.CANCELLED;
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.BILL, link, billStatus);
    this.notificationGateway.sendNotification(receiverId, notification);
    return BaseResponse.withMessage({}, 'Hủy đơn hàng thành công!');
  }

  private async handleCancelBill(bill: Bill, reason: string) {
    const redisClient = this.redisService.getClient();
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      for (const product of bill.products) {
        await this.productModel.findByIdAndUpdate(product.id, { $inc: { quantity: product.quantity } }, { session });
      }
      /**
       * check tất cả bill có cùng paymentId đều có status = CANCELLED -> mới hoàn lại coins và promotion
       * hoặc tổng số lượng bill có cùng paymentId = 1
       */
      const totalOrder = await this.billModel.countDocuments({ paymentId: bill.paymentId });
      const numOfCancelOrder = await this.billModel.countDocuments({ paymentId: bill.paymentId, status: BILL_STATUS.CANCELLED });
      if (totalOrder === 1 || numOfCancelOrder === totalOrder - 1) {
        const data = await redisClient.get(bill.paymentId);
        if (data) {
          const { numOfCoins, promotionId } = JSON.parse(data);
          if (promotionId) {
            await this.promotionModel.findByIdAndUpdate(
              promotionId,
              { $inc: { quantity: 1 }, $pull: { userUses: { $elemMatch: { $eq: bill.userId } } } },
              { session },
            );
          }
          await this.userModel.findByIdAndUpdate(bill.userId, { $inc: { wallet: numOfCoins } });
          await redisClient.del(bill.paymentId);
        }
      }
      await this.billModel.findByIdAndUpdate(bill._id, { status: BILL_STATUS.CANCELLED, reason }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await session.endSession();
    }
  }

  async refundBill(userId: string, billId: string, body: BillReasonREQ) {
    this.logger.log(`Refund Bill: ${billId}`);
    const bill = await this.billModel.findOne({ _id: new ObjectId(billId), userId });
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (bill.status === BILL_STATUS.DELIVERED && bill.isSuccess)
      throw new BadRequestException('Không thể hoàn trả đơn hàng này!');
    await this.userBillTrackingService.checkUserNotAllowDoBehavior(userId, BILL_STATUS.REFUND);
    bill.status = BILL_STATUS.REFUND;
    bill.isSuccess = false;
    bill.reason = body.reason;
    await bill.save();
    await this.userBillTrackingService.handleUserBillTracking(bill._id, userId, BILL_STATUS.REFUND);

    const store = await this.storeModel.findById(bill.storeId).lean();
    // Send notification to seller
    const product = bill.products[0];
    const subjectInfoToSeller = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
    const receiverIdToSeller = store.userId;
    const linkToSeller = NOTIFICATION_LINK[BILL_STATUS.REFUND] + bill.storeId;
    const billStatusToSeller = BILL_STATUS_NOTIFICATION.REFUND_SELLER;
    const notificationToSeller = await this.notificationService.create(
      receiverIdToSeller,
      subjectInfoToSeller,
      NotificationType.BILL,
      linkToSeller,
      billStatusToSeller,
    );
    this.notificationGateway.sendNotification(receiverIdToSeller, notificationToSeller);

    // Send notification to user
    const subjectInfoToUser = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
    const receiverIdToUser = bill.userId;
    const linkToUser = NOTIFICATION_LINK[NotificationType.BILL];
    const billStatusToUser = BILL_STATUS_NOTIFICATION.REFUND_USER;
    const notificationToUser = await this.notificationService.create(
      receiverIdToUser,
      subjectInfoToUser,
      NotificationType.BILL,
      linkToUser,
      billStatusToUser,
    );
    this.notificationGateway.sendNotification(receiverIdToUser, notificationToUser);

    return BaseResponse.withMessage({}, 'Hoàn đơn hàng thành công!');
  }

  async confirmRefundBill(userId: string, billId: string) {
    this.logger.log(`Confirm Refund Bill: ${billId}`);
    const store = await this.storeModel.findOne({ userId }).lean();
    if (!store) throw new ForbiddenException('Bạn không có quyền xác nhận hoàn trả đơn hàng này!');
    const bill = await this.billModel.findOne({ _id: new ObjectId(billId), storeId: store._id.toString() });
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (!(bill.status === BILL_STATUS.REFUND && !bill.isRefundSuccess))
      throw new BadRequestException('Không thể xác nhận hoàn trả đơn hàng này!');
    await Promise.all(
      bill.products.map(async (product) => {
        await this.productModel.findByIdAndUpdate(product.id, { $inc: { quantity: product.quantity } });
      }),
    );
    bill.isRefundSuccess = true;
    await bill.save();

    // Send notification
    const product = bill.products[0];
    const subjectInfo = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
    const receiverId = bill.userId;
    const link = NOTIFICATION_LINK[NotificationType.BILL];
    const billStatus = BILL_STATUS_NOTIFICATION.CONFIRMED_REFUND;
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.BILL, link, billStatus);
    this.notificationGateway.sendNotification(receiverId, notification);
    return BaseResponse.withMessage({}, 'Xác nhận hoàn trả đơn hàng thành công!');
  }

  async confirmDeliveredBillByUser(userId: string, billId: string) {
    this.logger.log(`Confirm delivered bill by user`);
    const bill = await this.billModel.findOne({
      _id: new ObjectId(billId),
      status: BILL_STATUS.DELIVERING,
      userId,
      isShipperConfirmed: true,
      isUserConfirmed: false,
    });
    if (!bill) throw new NotFoundException('Đơn hàng không hợp lệ!');
    bill.status = BILL_STATUS.DELIVERED;
    bill.isUserConfirmed = true;
    bill.processDate = new Date();
    await bill.save();

    const store = await this.storeModel.findById(bill.storeId).lean();
    // Send notification
    const product = bill.products[0];
    const subjectInfo = NotificationSubjectInfoDTO.ofProduct(product.id, product.name, product.avatar);
    const receiverId = store.userId;
    const link = NOTIFICATION_LINK[BILL_STATUS.DELIVERED] + bill.storeId;
    const billStatus = BILL_STATUS_NOTIFICATION.CONFIRM_DELIVERED_BY_USER;
    const notification = await this.notificationService.create(receiverId, subjectInfo, NotificationType.BILL, link, billStatus);
    this.notificationGateway.sendNotification(receiverId, notification);
    return BaseResponse.withMessage({}, 'Xác nhận giao hàng thành công!');
  }
}
