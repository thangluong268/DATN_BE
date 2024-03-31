import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CartService } from 'domains/cart/cart.service';
import { ProductService } from 'domains/product/product.service';
import { Product } from 'domains/product/schema/product.schema';
import { Promotion } from 'domains/promotion/schema/promotion.schema';
import { StoreService } from 'domains/store/store.service';
import { Tax } from 'domains/tax/schema/tax.schema';
import { User } from 'domains/user/schema/user.schema';
import { UserService } from 'domains/user/user.service';
import { Connection, Model } from 'mongoose';
import { PaymentDTO } from 'payment/dto/payment.dto';
import { PaypalGateway, VNPayGateway } from 'payment/payment.gateway';
import { PaymentService } from 'payment/payment.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';
import { RedisService } from 'services/redis/redis.service';
import { BILL_STATUS, PAYMENT_METHOD } from 'shared/enums/bill.enum';
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
import { CountTotalByStatusUserRESP } from './response/bill-count-total-by-status-user.response';
import { BillSeller } from './schema/bill-seller.schema';
import { BillUser } from './schema/bill-user.schema';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);
  constructor(
    @InjectModel(BillUser.name)
    private readonly billUserModel: Model<BillUser>,
    @InjectModel(BillSeller.name)
    private readonly billSellerModel: Model<BillSeller>,
    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,

    private readonly storeService: StoreService,
    private readonly cartService: CartService,

    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<Promotion>,

    @InjectModel(Tax.name)
    private readonly taxModel: Model<Tax>,

    private readonly paymentService: PaymentService,
    private readonly paypalPaymentService: PaypalPaymentService,
    private readonly redisService: RedisService,
  ) {
    this.paymentService.registerPaymentGateway.set(PAYMENT_METHOD.VNPAY, new VNPayGateway());
    this.paymentService.registerPaymentGateway.set(PAYMENT_METHOD.PAYPAL, new PaypalGateway(this.paypalPaymentService));
  }

  async create(userId: string, body: BillCreateREQ) {
    this.logger.log(`create bill: ${userId}`);
    let totalPrice = 0;
    let numOfCoins = 0;
    let totalDeliveryFee = 0;
    const paymentId = uuid();
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // Coins
      if (!isBlank(body.coins)) {
        const user = await this.userService.findById(userId);
        if (user.wallet < body.coins) throw new BadRequestException('Số dư xu không đủ!');
        numOfCoins = body.coins;
      }
      for (const cart of body.data) {
        totalPrice += cart.totalPrice;
        totalDeliveryFee += cart.deliveryFee;
        await this.billSellerModel.create([BillCreateREQ.toCreateBillSeller(cart, userId, body, paymentId)], { session });
        await this.taxModel.create([BillCreateREQ.toCreateTax(cart.storeId, cart.totalPrice, paymentId)], { session });
      }
      const discountValue = await this.calculateDiscount(numOfCoins, body.promotionId, body.data, totalPrice);
      body['initTotalPayment'] = totalPrice;
      totalPrice += totalDeliveryFee - discountValue;
      if (totalPrice < 0) totalPrice = 0;
      await this.billUserModel.create(
        [BillCreateREQ.toCreateBillUser(userId, body, paymentId, totalPrice, totalDeliveryFee, discountValue)],
        { session },
      );
      if (totalPrice !== body.totalPayment) throw new BadRequestException('Tổng tiền không hợp lệ!');
      if (body.paymentMethod === PAYMENT_METHOD.CASH) {
        await session.commitTransaction();
        await this.handleBillSuccess(paymentId);
        return BaseResponse.withMessage({}, 'Thanh toán thành công!');
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

  async calculateDiscount(numOfCoins: number, promotionId: string, carts: CartInfoDTO[], totalPrice: number) {
    const coinsValue = numOfCoins * 100; // 1 xu = 100đ
    let promotionValue = 0;
    if (promotionId) {
      const storeIds = carts.map((cart) => cart.storeId);
      const promotion = await this.promotionModel.findOne({
        _id: promotionId,
        storeIds: { $in: storeIds },
        isActive: true,
      });
      if (!promotion) throw new BadRequestException('Khuyến mãi không hợp lệ!');
      if (promotion.quantity === 0) throw new BadRequestException('Khuyến mãi đã hết!');
      promotionValue = Math.floor((totalPrice * promotion.value) / 100);
      if (promotionValue > promotion.maxDiscountValue) promotionValue = promotion.maxDiscountValue;
    }
    return coinsValue + promotionValue;
  }

  async handleBillSuccess(paymentId: string) {
    this.logger.log(`Handle Bill Success: ${paymentId}`);
    const billSellers = await this.billSellerModel.find({ paymentId }).lean();
    billSellers.forEach(async (bill) => {
      await this.cartService.removeMultiProductInCart(bill.userId, bill.storeId, bill.products);
      bill.products.forEach(async (product) => {
        await this.productService.decreaseQuantity(product.id, product.quantity);
      });
      await this.billSellerModel.findByIdAndUpdate(bill._id, {
        isPaid: bill.paymentMethod === PAYMENT_METHOD.CASH ? false : true,
      });
    });
    const billUser = await this.billUserModel.findOne({ paymentId }).lean();
    const userId = billUser.userId;
    const promotionId = billUser.promotionId;
    await this.userService.updateWallet(userId, billUser.totalPayment, 'plus');
    await this.userModel.findByIdAndUpdate(userId, { $inc: { wallet: -billUser.coins } });
    await this.promotionModel.findByIdAndUpdate(promotionId, { $inc: { quantity: -1 }, $pull: { userSaves: userId } });
    const isUserUsedPromotion = await this.promotionModel.findOne({ _id: promotionId, userUses: userId }).lean();
    if (!isUserUsedPromotion) {
      await this.promotionModel.findByIdAndUpdate(promotionId, { $push: { userUses: userId } });
    }
  }

  async handleBillFail(paymentId: string) {
    this.logger.log(`Handle Bill Fail: ${paymentId}`);
    await this.billSellerModel.deleteMany({ paymentId });
    await this.billUserModel.deleteOne({ paymentId });
    await this.taxModel.deleteMany({ paymentId });
  }

  async countTotalByStatusSeller(userId: string, year: number) {
    this.logger.log(`Count Total By Status Seller: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billSellerModel.aggregate(BillGetTotalByStatusSellerREQ.toQueryCondition(store._id, year));
    return BaseResponse.withMessage(data, 'Lấy tổng số lượng các đơn theo trạng thái thành công!');
  }

  async countTotalByStatusUser(userId: string) {
    this.logger.log(`Count Total By Status User: ${userId}`);
    const data = await this.billSellerModel.aggregate([
      { $match: { userId: userId.toString() } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);
    return BaseResponse.withMessage(
      Object.keys(BILL_STATUS).map((status) => CountTotalByStatusUserRESP.of(status, data)),
      // data.map((item) => CountTotalByStatusUserRESP.of(item)),
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }

  async calculateRevenueByYear(userId: string, year: number) {
    this.logger.log(`Calculate Revenue By Year: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billSellerModel.aggregate(BillGetCalculateRevenueByYearREQ.toQueryCondition(year, store._id));
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
    const totalRevenueAllTime = await this.billSellerModel.aggregate(
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
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billSellerModel.aggregate(BillGetCountCharityByYearREQ.toQueryCondition(store._id, year));
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
    const totalAllTime = await this.billSellerModel.aggregate(BillGetCountCharityByYearREQ.toQueryConditionForAllTime(store._id));
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
    const data = await this.billSellerModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryCondition(year));
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
    const revenueAllTime = await this.billSellerModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryConditionForAllTime());
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
    const totalCount = await this.billUserModel.aggregate(BillGetAllByStatusUserREQ.toCount(userId, query) as any);
    const data = await this.billUserModel.aggregate(BillGetAllByStatusUserREQ.toFind(userId, query) as any);
    await Promise.all(
      data.map(async (bill) => {
        await Promise.all(
          bill.data.map(async (data) => {
            await Promise.all(
              data.products.map(async (product) => {
                const productInfo = await this.productService.findById(product.id);
                product.avatar = productInfo.avatar;
                product.name = productInfo.name;
                product.oldPrice = productInfo.oldPrice;
                product.newPrice = productInfo.newPrice;
              }),
            );
          }),
        );
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(data, totalCount[0]?.total || 0, 'Lấy danh sách đơn hàng thành công!');
  }

  async getAllByStatusSeller(userId: string, query: BillGetAllByStatusSellerREQ) {
    this.logger.log(`Get All By Status Seller: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const total = await this.billSellerModel.countDocuments(BillGetAllByStatusSellerREQ.toCount(store._id.toString(), query));
    const data = await this.billSellerModel.aggregate(BillGetAllByStatusSellerREQ.toFind(store._id.toString(), query) as any);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async countTotalData() {
    this.logger.log(`Count Total Data`);
    const totalProduct = await this.productService.countTotal();
    const totalStore = await this.storeService.countTotal();
    const totalUser = await this.userService.countTotal();
    const totalRevenueAllTime = await this.billSellerModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryConditionForAllTime());
    const data = {
      totalProduct,
      totalStore,
      totalUser,
      totalRevenue: totalRevenueAllTime[0]?.totalRevenue || 0,
    };
    return BaseResponse.withMessage(data, 'Lấy tổng số lượng dữ liệu thành công!');
  }

  async revenueStore(storeId: string) {
    this.logger.log(`Revenue Store: ${storeId}`);
    const totalRevenueAllTime = await this.billSellerModel.aggregate(BillGetRevenueStoreREQ.toQueryRevenueAllTime(storeId));
    const totalDelivered = await this.billSellerModel.countDocuments({ storeId, status: BILL_STATUS.DELIVERED });
    return BaseResponse.withMessage(
      { totalRevenue: totalRevenueAllTime[0]?.totalRevenue || 0, totalDelivered },
      'Lấy dữ liệu thành công!',
    );
  }

  // async getMyBill(userId: string, billId: string) {
  //   this.logger.log(`Get My Bill: ${userId}`);
  //   const bill = await this.billModel.findOne({ _id: billId, userId }, {}, { lean: true });
  //   if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
  //   const listProductsFullInfo = await Promise.all(
  //     bill.products.map(async (product) => {
  //       const productFullInfo = await this.productService.findById(product.id);
  //       const productData = {
  //         product: productFullInfo,
  //         subInfo: { quantity: product.quantity },
  //       };
  //       return productData;
  //     }),
  //   );
  //   const store = await this.storeService.findById(bill.storeId);
  //   const user = await this.userService.findById(bill.userId);
  //   return BaseResponse.withMessage(
  //     GetMyBillRESP.of(bill, store, user, listProductsFullInfo),
  //     'Lấy thông tin đơn hàng thành công!',
  //   );
  // }

  // async updateStatusBillUser(billId: string, status: string) {
  //   this.logger.log(`Update Status Bill User: ${billId}`);
  //   if (status !== BILL_STATUS.CANCELLED && status !== BILL_STATUS.RETURNED)
  //     throw new BadRequestException('Trạng thái không hợp lệ!');
  //   const bill = await this.billModel.findById(billId);
  //   if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
  //   await this.billModel.findByIdAndUpdate({ _id: billId }, { status }, { new: true });
  //   if (status === 'CANCELLED') {
  //     await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
  //   }
  //   if (status === 'RETURNED') {
  //     await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
  //     await this.userService.updateWallet(bill.userId, bill.totalPrice * 5, 'plus');
  //   }
  //   return BaseResponse.withMessage({}, 'Cập nhật trạng thái đơn hàng thành công!');
  // }

  async updateStatusBillSeller(billId: string, status: string) {
    this.logger.log(`Update Status Bill Seller: ${billId}`);
    const bill = await this.billSellerModel.findById(billId, {}, { lean: true });
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    const updatedBill = await this.billSellerModel.findByIdAndUpdate({ _id: billId }, { status }, { new: true });
    if (updatedBill.paymentMethod === PAYMENT_METHOD.CASH && status === BILL_STATUS.DELIVERED) {
      updatedBill.isPaid = true;
      updatedBill.save();
    }
    if (status === 'CANCELLED') await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
    return BaseResponse.withMessage({}, 'Cập nhật trạng thái đơn hàng thành công!');
  }

  async countProductDelivered(productId: string, type: string, status: BILL_STATUS) {
    return await this.billSellerModel.countDocuments({
      products: { $elemMatch: { id: productId.toString(), type: type.toUpperCase() } },
      status,
    });
  }

  async checkProductPurchased(productId: string) {
    const bill = await this.billUserModel.findOne({ products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async checkProductPurchasedByUser(userId: string, productId: string) {
    const bill = await this.billUserModel.findOne({ userId, products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async getUsersHaveMostBill(limit: number) {
    this.logger.log(`Get Users Have Most Bill: ${limit}`);
    return await this.billUserModel.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
    ]);
  }

  async calculateRevenueAllTimeByStoreId(storeId: string) {
    const result = await this.billSellerModel.aggregate([
      { $match: { status: BILL_STATUS.DELIVERED, storeId: storeId.toString() } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    return result[0]?.totalRevenue || 0;
  }

  // async cancelBill(billId: string) {
  //   this.logger.log(`Cancel Bill: ${billId}`);
  //   const bill = await this.billModel.findById(billId).lean();
  //   if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
  //   if (bill.status !== BILL_STATUS.NEW) throw new BadRequestException('Không thể hủy đơn hàng này!');
  //   const session = await this.connection.startSession();
  //   session.startTransaction();
  //   try {
  //     await this.billModel.findByIdAndUpdate(billId, { status: 'CANCELLED' });
  //     bill.products.forEach(async (product) => {
  //       await this.productModel.findByIdAndUpdate(product.id, { $inc: { quantity: product.quantity } });
  //     });
  //     if (bill.promotionId) {
  //       await this.promotionModel.findByIdAndUpdate(bill.promotionId, {
  //         $inc: { quantity: 1 },
  //         $push: { userSaves: bill.userId },
  //         $pull: { userUses: bill.userId },
  //       });
  //     }
  //     await this.userService.updateWallet(bill.userId, bill.totalPrice, 'minus');
  //     const numOfSameOrder = await this.billModel.countDocuments({ paymentId: bill.paymentId });
  //     const redisClient = this.redisService.getClient();
  //     const coinsUsed = await redisClient.get(bill.paymentId);
  //     const coins = Number(coinsUsed) / numOfSameOrder;
  //     await this.userModel.findByIdAndUpdate(bill.userId, { $inc: { wallet: coins } });
  //     await session.commitTransaction();
  //     session.endSession();
  //   } catch (err) {
  //     await session.abortTransaction();
  //     throw err;
  //   }
  // }
}
