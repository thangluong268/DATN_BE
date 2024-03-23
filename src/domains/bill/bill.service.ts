import { BadRequestException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { TAX_RATE } from 'app.config';
import { CartService } from 'domains/cart/cart.service';
import { ProductService } from 'domains/product/product.service';
import { Product } from 'domains/product/schema/product.schema';
import { Promotion } from 'domains/promotion/schema/promotion.schema';
import { StoreService } from 'domains/store/store.service';
import { Tax } from 'domains/tax/schema/tax.schema';
import { User } from 'domains/user/schema/user.schema';
import { UserService } from 'domains/user/user.service';
import { Response } from 'express';
import { Connection, Model } from 'mongoose';
import { PaymentDTO } from 'payment/dto/payment.dto';
import { PaypalGateway, VNPayGateway } from 'payment/payment.gateway';
import { PaymentService } from 'payment/payment.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';
import { RedisService } from 'services/redis/redis.service';
import { BILL_STATUS, BILL_STATUS_TRANSITION } from 'shared/constants/bill.constant';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
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
import { BillGetAllByStatusUserRESP } from './response/bill-get-all-by-status-user.response';
import { GetMyBillRESP } from './response/get-my-bill.response';
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

  async create(userId: string, body: BillCreateREQ, res: Response) {
    this.logger.log(`create bill: ${userId}`);
    let totalPrice = 0;
    let numOfCoins = 0;
    const paymentId = uuid();
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // Coins
      if (body.coins) {
        const user = await this.userService.findById(userId);
        if (user.wallet < body.coins) throw new BadRequestException('Số dư xu không đủ!');
        numOfCoins = body.coins;
      }
      const numOfStore = body.data.length;
      const discountValueCoins = this.calculateDiscountCoins(numOfStore, numOfCoins);
      const newBills = await Promise.all(
        body.data.map(async (cart) => {
          // Use discount value
          await this.usePromotion(cart, userId);
          cart['initTotalPrice'] = cart.totalPrice;
          cart.totalPrice += cart.deliveryFee - discountValueCoins;
          totalPrice += cart.totalPrice;
          const newBill = await this.billModel.create(cart);
          BillCreateREQ.saveData(newBill, userId, body, paymentId);
          await this.taxModel.create({
            storeId: cart.storeId,
            totalPayment: cart.totalPrice,
            totalTax: cart.totalPrice * TAX_RATE,
            paymentId,
          });
          return newBill;
        }),
      );
      const redisClient = this.redisService.getClient();
      await redisClient.setex(paymentId, 3600, numOfCoins); // set expire 1 hours
      if (body.paymentMethod === PAYMENT_METHOD.CASH) {
        await this.handleBillSuccess(paymentId);
        await session.commitTransaction();
        session.endSession();
        return newBills.map((bill) => toDocModel(bill));
      }
      const paymentBody = { paymentId, amount: totalPrice } as PaymentDTO;
      await this.paymentService.processPayment(paymentBody, body.paymentMethod, res);
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    }
  }

  calculateDiscountShip(numOfStore: number, promotionShipValue: number) {
    return promotionShipValue / numOfStore;
  }

  calculateDiscountCoins(numOfStore: number, numOfCoins: number) {
    const coinsValue = numOfCoins * 100; // 1 xu = 100đ
    return Math.floor(coinsValue / numOfStore);
  }

  async usePromotion(cart: CartInfoDTO, userId: string) {
    if (!isBlank(cart.promotionId)) {
      const promotion = await this.promotionModel.findOne({
        _id: cart.promotionId,
        storeIds: cart.storeId,
        isActive: true,
      });
      if (!promotion) throw new BadRequestException('Khuyến mãi không hợp lệ!');
      if (promotion.userUses.includes(userId)) throw new BadRequestException('Khuyến mãi đã được sử dụng!');
      if (promotion.quantity === 0) throw new BadRequestException('Khuyến mãi đã hết!');
      const discountValue = Math.floor((cart.totalPrice * promotion.value) / 100);
      if (discountValue > promotion.maxDiscountValue) throw new BadRequestException('Khuyến mãi không hợp lệ!');
      cart.totalPrice -= discountValue;
    }
  }

  async handleBillSuccess(paymentId: string) {
    this.logger.log(`Handle Bill Success: ${paymentId}`);
    const bills = await this.billModel.find({ paymentId }).lean();
    bills.forEach(async (bill) => {
      const userId = bill.userId;
      await this.cartService.removeMultiProductInCart(userId, bill.storeId, bill.products);
      bill.products.forEach(async (product) => {
        await this.productService.decreaseQuantity(product.id, product.quantity);
      });
      await this.billModel.findByIdAndUpdate(bill._id, { isPaid: true });
      await this.promotionModel.findByIdAndUpdate(bill.promotionId, {
        $inc: { quantity: -1 },
        $pull: { userSaves: userId },
      });
      const isUserUsedPromotion = await this.promotionModel.findOne({ _id: bill.promotionId, userUses: userId }).lean();
      if (!isUserUsedPromotion) {
        await this.promotionModel.findByIdAndUpdate(bill.promotionId, { $push: { userUses: userId } });
      }
      await this.userService.updateWallet(userId, bill.totalPrice, 'plus');
    });
    const userId = bills[0].userId;
    const redisClient = this.redisService.getClient();
    const numOfCoins = await redisClient.get(paymentId);
    if (numOfCoins) await this.userModel.findByIdAndUpdate(userId, { $inc: { wallet: -Number(numOfCoins) } });
  }

  async handleBillFail(paymentId: string) {
    this.logger.log(`Handle Bill Fail: ${paymentId}`);
    const bills = await this.billModel.find({ paymentId }).lean();
    bills.forEach(async (bill) => {
      await this.billModel.findByIdAndDelete(bill._id);
    });
    const userId = bills[0].userId;
    const redisClient = this.redisService.getClient();
    const numOfCoins = await redisClient.get(paymentId);
    if (numOfCoins) await this.userModel.findByIdAndUpdate(userId, { $inc: { wallet: Number(numOfCoins) } });
  }

  async countTotalByStatusSeller(userId: string, year: number) {
    this.logger.log(`Count Total By Status Seller: ${userId}`);
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const statusData: string[] = BILL_STATUS.split('-').map((item: string) => item.toUpperCase());
    const countTotal = await Promise.all(
      statusData.map(async (status: string) => {
        return this.billModel.countDocuments(BillGetTotalByStatusSellerREQ.toQueryCondition(store._id, status, year));
      }),
    );
    const transformedData = Object.fromEntries(countTotal.map((value, index) => [statusData[index], value]));
    return BaseResponse.withMessage<{ [k: string]: number }>(
      transformedData,
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }

  async countTotalByStatusUser(userId: string) {
    this.logger.log(`Count Total By Status User: ${userId}`);
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const statusData: string[] = BILL_STATUS.split('-').map((item: string) => item.toUpperCase());
    const countTotal = await Promise.all(
      statusData.map(async (status: string) => {
        const query = { userId, status };
        return await this.billModel.countDocuments({ ...query });
      }),
    );
    const transformedData = countTotal.map((value, index) => {
      return {
        status: statusData[index],
        title: BILL_STATUS_TRANSITION[statusData[index]],
        value: value,
      };
    });
    return BaseResponse.withMessage<{ status: string; title: string; value: number }[]>(
      transformedData,
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }

  async calculateRevenueByYear(userId: string, year: number) {
    this.logger.log(`Calculate Revenue By Year: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetCalculateRevenueByYearREQ.toQueryCondition(year, store._id));
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
    const response = {
      data: monthlyRevenue,
      revenueTotalAllTime: totalRevenueAllTime[0]?.totalRevenue || 0,
      revenueTotalInYear: totalRevenue,
      minRevenue,
      maxRevenue,
    };
    return BaseResponse.withMessage(response, 'Lấy doanh thu của từng tháng theo năm thành công!');
  }

  async countCharityByYear(userId: string, year: number) {
    this.logger.log(`Count Charity By Year: ${userId}`);
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeService.findByUserId(userId);
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
    const data = await this.billModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryCondition(year));
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
    const condition = BillGetAllByStatusUserREQ.toQueryCondition(userId, query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const total = await this.billModel.countDocuments(condition);
    const bills = await this.billModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).limit(limit).skip(skip);
    const fullData = await Promise.all(
      bills.map(async (bill) => {
        const productsFullInfo = await Promise.all(
          bill.products.map(async (product) => {
            const productFullInfo = await this.productService.findById(product.id);
            const productData = {
              product: productFullInfo,
              subInfo: { quantity: product.quantity },
            };
            return productData;
          }),
        );
        const storeInfo = await this.storeService.findById(bill.storeId);
        const userInfo = await this.userService.findById(bill.userId);
        return BillGetAllByStatusUserRESP.of(bill, storeInfo, productsFullInfo, userInfo);
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(fullData, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async getAllByStatusSeller(userId: string, query: BillGetAllByStatusSellerREQ) {
    this.logger.log(`Get All By Status Seller: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const condition = BillGetAllByStatusSellerREQ.toQueryCondition(store._id, query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.billModel.countDocuments(condition);
    const bills = await this.billModel.find(condition, {}, { lean: true }).sort({ createdAt: -1 }).limit(limit).skip(skip);
    const fullData = await Promise.all(
      bills.map(async (bill) => {
        const productsFullInfo = await Promise.all(
          bill.products.map(async (product) => {
            const productFullInfo = await this.productService.findById(product.id);
            const productData = {
              product: productFullInfo,
              subInfo: { quantity: product.quantity },
            };
            return productData;
          }),
        );
        const storeInfo = await this.storeService.findById(bill.storeId);
        const userInfo = await this.userService.findById(bill.userId);
        return BillGetAllByStatusUserRESP.of(bill, storeInfo, productsFullInfo, userInfo);
      }),
    );
    return PaginationResponse.ofWithTotalAndMessage(fullData, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async countTotalData() {
    this.logger.log(`Count Total Data`);
    const totalProduct = await this.productService.countTotal();
    const totalStore = await this.storeService.countTotal();
    const totalUser = await this.userService.countTotal();
    const totalRevenueAllTime = await this.billModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryConditionForAllTime());
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
    const totalRevenueAllTime = await this.billModel.aggregate(BillGetRevenueStoreREQ.toQueryRevenueAllTime(storeId));
    const totalDelivered = await this.billModel.countDocuments({ storeId, status: 'DELIVERED' });
    return BaseResponse.withMessage(
      { totalRevenue: totalRevenueAllTime[0]?.totalRevenue || 0, totalDelivered },
      'Lấy dữ liệu thành công!',
    );
  }

  async getMyBill(userId: string, billId: string) {
    this.logger.log(`Get My Bill: ${userId}`);
    const bill = await this.billModel.findOne({ _id: billId, userId }, {}, { lean: true });
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    const listProductsFullInfo = await Promise.all(
      bill.products.map(async (product) => {
        const productFullInfo = await this.productService.findById(product.id);
        const productData = {
          product: productFullInfo,
          subInfo: { quantity: product.quantity },
        };
        return productData;
      }),
    );
    const store = await this.storeService.findById(bill.storeId);
    const user = await this.userService.findById(bill.userId);
    return BaseResponse.withMessage(
      GetMyBillRESP.of(bill, store, user, listProductsFullInfo),
      'Lấy thông tin đơn hàng thành công!',
    );
  }

  async updateStatusBillUser(billId: string, status: string) {
    this.logger.log(`Update Status Bill User: ${billId}`);
    if (status !== 'CANCELLED' && status !== 'RETURNED') throw new BadRequestException('Trạng thái không hợp lệ!');
    const bill = await this.billModel.findById(billId);
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    await this.billModel.findByIdAndUpdate({ _id: billId }, { status }, { new: true });
    if (status === 'CANCELLED') {
      await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
    }
    if (status === 'RETURNED') {
      await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
      await this.userService.updateWallet(bill.userId, bill.totalPrice * 5, 'plus');
    }
    return BaseResponse.withMessage({}, 'Cập nhật trạng thái đơn hàng thành công!');
  }

  async updateStatusBillSeller(billId: string, status: string) {
    this.logger.log(`Update Status Bill Seller: ${billId}`);
    const bill = await this.billModel.findById(billId, {}, { lean: true });
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    const updatedBill = await this.billModel.findByIdAndUpdate({ _id: billId }, { status }, { new: true });
    if (updatedBill.paymentMethod === 'CASH' && status === 'DELIVERED') {
      updatedBill.isPaid = true;
      updatedBill.save();
    }
    if (status === 'CANCELLED') await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
    return BaseResponse.withMessage({}, 'Cập nhật trạng thái đơn hàng thành công!');
  }

  async countProductDelivered(productId: string, type: string, status: string) {
    return await this.billModel.countDocuments({
      products: { $elemMatch: { id: productId.toString(), type: type.toUpperCase() } },
      status: status.toUpperCase(),
    });
  }

  async checkProductPurchased(productId: string) {
    const bill = await this.billModel.findOne({ products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async checkProductPurchasedByUser(userId: string, productId: string) {
    const bill = await this.billModel.findOne({ userId, products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async getUsersHaveMostBill(limit: number) {
    this.logger.log(`Get Users Have Most Bill: ${limit}`);
    return await this.billModel.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
    ]);
  }

  async calculateRevenueAllTimeByStoreId(storeId: string) {
    const result = await this.billModel.aggregate([
      { $match: { status: 'DELIVERED', storeId: storeId.toString() } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    return result[0]?.totalRevenue || 0;
  }

  async getByPaymentId(paymentId: string) {
    return await this.billModel.find({ paymentId }).lean();
  }

  async updateIsPaid(billId: string) {
    await this.billModel.findByIdAndUpdate(billId, { isPaid: true });
  }

  async cancelBill(billId: string) {
    this.logger.log(`Cancel Bill: ${billId}`);
    const bill = await this.billModel.findById(billId).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (bill.status !== 'NEW') throw new BadRequestException('Không thể hủy đơn hàng này!');
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.billModel.findByIdAndUpdate(billId, { status: 'CANCELLED' });
      bill.products.forEach(async (product) => {
        await this.productModel.findByIdAndUpdate(product.id, { $inc: { quantity: product.quantity } });
      });
      if (bill.promotionId) {
        await this.promotionModel.findByIdAndUpdate(bill.promotionId, {
          $inc: { quantity: 1 },
          $push: { userSaves: bill.userId },
          $pull: { userUses: bill.userId },
        });
      }
      await this.userService.updateWallet(bill.userId, bill.totalPrice, 'minus');
      const numOfSameOrder = await this.billModel.countDocuments({ paymentId: bill.paymentId });
      const redisClient = this.redisService.getClient();
      const coinsUsed = await redisClient.get(bill.paymentId);
      const coins = Number(coinsUsed) / numOfSameOrder;
      await this.userModel.findByIdAndUpdate(bill.userId, { $inc: { wallet: coins } });
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    }
  }
}
