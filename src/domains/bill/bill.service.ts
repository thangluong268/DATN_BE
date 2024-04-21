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
import { ObjectId } from 'mongodb';
import { ClientSession, Connection, Model } from 'mongoose';
import { PaymentDTO } from 'payment/dto/payment.dto';
import { PaypalGateway, VNPayGateway } from 'payment/payment.gateway';
import { PaymentService } from 'payment/payment.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';
import { RedisService } from 'services/redis/redis.service';
import { BILL_STATUS, PAYMENT_METHOD, PRODUCT_TYPE } from 'shared/enums/bill.enum';
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
import { CountTotalByStatusRESP } from './response/bill-count-total-by-status.response';
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
        const user = await this.userService.findById(userId);
        if (user.wallet < body.coins) throw new BadRequestException('Số dư xu không đủ!');
        numOfCoins = body.coins;
      }
      await this.calculateDiscount(numOfCoins, body.promotionId, body.data);
      await this.calculateTax(body.data, paymentId, session);

      const redisClient = this.redisService.getClient();
      await redisClient.set(paymentId, JSON.stringify({ numOfCoins, promotionId: body.promotionId }));

      for (const cart of body.data) {
        totalPrice += cart['totalPricePayment'];
        await this.billModel.create([BillCreateREQ.toCreateBill(cart, userId, body, paymentId)], { session });
      }
      console.log(totalPrice);
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

  async calculateTax(carts: CartInfoDTO[], paymentId: string, session: ClientSession) {
    for (const [index, cart] of carts.entries()) {
      const taxFee = Math.ceil(carts[index]['totalPricePayment'] * TAX_RATE);
      const totalPrice = carts[index]['totalPricePayment'];
      carts[index]['totalPricePayment'] -= taxFee;
      await this.taxModel.create([{ storeId: cart.storeId, totalPrice, taxFee, paymentId }], { session });
    }
  }

  async calculateDiscount(numOfCoins: number, promotionId: string, carts: CartInfoDTO[]) {
    const coinsValue = numOfCoins * 100; // 1 xu = 100đ
    const totalPrice = carts.reduce((acc, cart) => acc + (cart.totalPrice + cart.deliveryFee), 0);
    const numOfStores = carts.length;
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
    const discountValuePerStore = Math.floor((coinsValue + promotionValue) / numOfStores);
    let discountRemain = 0;
    for (const [index, cart] of carts.entries()) {
      if (discountValuePerStore > cart.totalPrice + cart.deliveryFee) {
        discountRemain += discountValuePerStore - (cart.totalPrice + cart.deliveryFee);
        carts[index]['totalPricePayment'] = 0;
        continue;
      }
      carts[index]['totalPricePayment'] = cart.totalPrice + cart.deliveryFee - discountValuePerStore;
    }
    if (discountRemain > 0) {
      const numOfStore = carts.filter((cart) => cart['totalPricePayment'] > 0).length;
      const discountValuePerStore = Math.floor(discountRemain / numOfStore);
      this.calculatorDiscountRemain(carts, discountValuePerStore);
    }
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
    let totalPrice = 0;
    let userId = null;
    const bills = await this.billModel.find({ paymentId }).lean();
    bills.forEach(async (bill) => {
      totalPrice += bill.totalPricePayment;
      userId = bill.userId;
      await this.cartService.removeMultiProductInCart(bill.userId, bill.storeId, bill.products);
      bill.products.forEach(async (product) => {
        await this.productService.decreaseQuantity(product.id, product.quantity);
      });
      await this.billModel.findByIdAndUpdate(bill._id, {
        isPaid: bill.paymentMethod === PAYMENT_METHOD.CASH ? false : true,
      });
    }),
      await this.userService.updateWallet(userId, totalPrice, 'plus');
    await this.taxModel.updateMany({ paymentId }, { isSuccess: true });
    const redisClient = this.redisService.getClient();
    const data = await redisClient.get(paymentId);
    if (data) {
      const { numOfCoins, promotionId } = JSON.parse(data);
      await this.userModel.findByIdAndUpdate(userId, { $inc: { wallet: -numOfCoins } });
      if (!promotionId) return;
      await this.promotionModel.findByIdAndUpdate(promotionId, {
        $inc: { quantity: -1 },
        $pull: { userSaves: userId },
        $push: { userUses: userId },
      });
    }
  }

  async handleBillFail(paymentId: string) {
    this.logger.log(`Handle Bill Fail: ${paymentId}`);
    await this.billModel.deleteMany({ paymentId });
    await this.taxModel.deleteMany({ paymentId });
  }

  async countTotalByStatusSeller(userId: string, year: number) {
    this.logger.log(`Count Total By Status Seller: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetTotalByStatusSellerREQ.toQueryCondition(store._id, year));
    return BaseResponse.withMessage(
      Object.keys(BILL_STATUS).map((status) => CountTotalByStatusRESP.of(status, data)),
      'Lấy tổng số lượng các đơn theo trạng thái thành công!',
    );
  }

  async countTotalByStatusUser(userId: string) {
    this.logger.log(`Count Total By Status User: ${userId}`);
    const data = await this.billModel.aggregate([
      { $match: { userId: userId.toString() } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);
    const billStatus = Object.keys(BILL_STATUS).filter((status) => status !== BILL_STATUS.PROCESSING);
    return BaseResponse.withMessage(
      billStatus.map((status) => CountTotalByStatusRESP.of(status, data)),
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
    const [data, total] = await Promise.all([
      this.billModel.aggregate(BillGetAllByStatusUserREQ.toFind(userId, query) as any),
      this.billModel.countDocuments(BillGetAllByStatusUserREQ.toCount(userId, query)),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async getAllByStatusSeller(userId: string, query: BillGetAllByStatusSellerREQ) {
    this.logger.log(`Get All By Status Seller: ${userId}`);
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const [data, total] = await Promise.all([
      this.billModel.aggregate(BillGetAllByStatusSellerREQ.toFind(store._id.toString(), query) as any),
      this.billModel.countDocuments(BillGetAllByStatusSellerREQ.toCount(store._id.toString(), query)),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách đơn hàng thành công!');
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
    const totalDelivered = await this.billModel.countDocuments({ storeId, status: BILL_STATUS.DELIVERED });
    return BaseResponse.withMessage(
      { totalRevenue: totalRevenueAllTime[0]?.totalRevenue || 0, totalDelivered },
      'Lấy dữ liệu thành công!',
    );
  }

  // async updateStatusBillSeller(billId: string, status: BILL_STATUS) {
  //   this.logger.log(`Update Status Bill Seller: ${billId}`);
  //   const bill = await this.billSellerModel.findById(billId, {}, { lean: true });
  //   if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
  //   const updatedBill = await this.billSellerModel.findByIdAndUpdate({ _id: billId }, { status }, { new: true });
  //   if (updatedBill.paymentMethod === PAYMENT_METHOD.CASH && status === BILL_STATUS.DELIVERED) {
  //     updatedBill.isPaid = true;
  //     updatedBill.save();
  //   }
  //   if (status === 'CANCELLED') await this.userService.updateWallet(bill.userId, bill.totalPrice, 'sub');
  //   return BaseResponse.withMessage({}, 'Cập nhật trạng thái đơn hàng thành công!');
  // }

  async countProductDelivered(productId: string, type: PRODUCT_TYPE, status: BILL_STATUS) {
    return await this.billModel.countDocuments({ products: { $elemMatch: { id: productId.toString(), type } }, status });
  }

  async checkProductPurchased(productId: string) {
    const bill = await this.billModel.findOne({ products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async checkProductPurchasedByUser(userId: string, productId: string) {
    const bill = await this.billModel.findOne({ userId, products: { $elemMatch: { id: productId.toString() } } });
    return bill ? true : false;
  }

  async calculateRevenueAllTimeByStoreId(storeId: string) {
    const result = await this.billModel.aggregate([
      { $match: { status: BILL_STATUS.DELIVERED, storeId: storeId.toString() } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPricePayment' } } },
    ]);
    return result[0]?.totalRevenue || 0;
  }

  async cancelBill(userId: string, billId: string) {
    this.logger.log(`Cancel Bill: ${billId}`);
    const bill = await this.billModel.findOne({ _id: new ObjectId(billId), userId }).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (bill.status !== BILL_STATUS.NEW && bill.status === BILL_STATUS.CANCELLED)
      throw new BadRequestException('Không thể hủy đơn hàng này!');
    const redisClient = this.redisService.getClient();
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      for (const product of bill.products) {
        await this.productModel.findByIdAndUpdate(product.id, { $inc: { quantity: product.quantity } }, { session });
      }
      const coinsRefund = Math.floor((bill.totalPricePayment * 0.2) / 1000);
      await this.userModel.findByIdAndUpdate(bill.userId, { $inc: { wallet: -coinsRefund } }, { session });
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
              {
                $inc: { quantity: 1 },
                $push: { userSaves: bill.userId },
                $pull: { userUses: bill.userId },
              },
              { session },
            );
          }
          await this.userModel.findByIdAndUpdate(bill.userId, { $inc: { wallet: numOfCoins } }, { session });
        }
      }
      await this.billModel.findByIdAndUpdate(billId, { status: BILL_STATUS.CANCELLED }, { session });
      await session.commitTransaction();
      await redisClient.del(bill.paymentId);
      return BaseResponse.withMessage({}, 'Hủy đơn hàng thành công!');
    } catch (err) {
      await session.abortTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await session.endSession();
    }
  }

  async refundBill(userId: string, billId: string) {
    this.logger.log(`Refund Bill: ${billId}`);
    const bill = await this.billModel.findOne({ _id: new ObjectId(billId), userId }).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng này!');
    if (bill.status !== BILL_STATUS.PROCESSING) throw new BadRequestException('Không thể hoàn trả đơn hàng này!');
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // TO DO...

      await session.commitTransaction();
      return BaseResponse.withMessage({}, 'Hoàn tiền đơn hàng thành công!');
    } catch (err) {
      await session.abortTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await session.endSession();
    }
  }
}
