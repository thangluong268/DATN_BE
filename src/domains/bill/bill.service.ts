import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CartService } from 'domains/cart/cart.service';
import { ProductService } from 'domains/product/product.service';
import { StoreService } from 'domains/store/store.service';
import { UserService } from 'domains/user/user.service';
import { Connection, Model } from 'mongoose';
import { BILL_STATUS, BILL_STATUS_TRANSITION } from 'shared/constants/bill.constant';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { ProductInfoDTO } from './dto/product-info.dto';
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
  constructor(
    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,
    @InjectConnection()
    private readonly connection: Connection,

    private readonly userService: UserService,

    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,

    private readonly storeService: StoreService,
    private readonly cartService: CartService,
  ) {}

  async create(userId: string, body: BillCreateREQ) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const newBills = [];
    for (const cart of body.data) {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        await this.userService.updateWallet(userId, cart.totalPrice, 'plus');
        await this.cartService.removeMultiProductInCart(userId, cart.storeId, cart.products);
        for (const product of cart.products) {
          await this.productService.decreaseQuantity(product.id, product.quantity);
        }
        cart.products.forEach((product: ProductInfoDTO) => {
          product.type = product.type.toUpperCase();
        });
        const newBill = await this.billModel.create(cart);
        BillCreateREQ.saveData(newBill, userId, body);
        newBills.push(newBill);
      } catch (err) {
        await session.abortTransaction();
        throw err;
      }
    }
    return newBills.map((bill) => toDocModel(bill));
  }

  async countTotalByStatusSeller(userId: string, year: number) {
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
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetCalculateRevenueByYearREQ.toQueryCondition(year, store._id));
    // Tạo mảng chứa 12 tháng với doanh thu mặc định là 0
    const monthlyRevenue = {
      'Tháng 1': 0,
      'Tháng 2': 0,
      'Tháng 3': 0,
      'Tháng 4': 0,
      'Tháng 5': 0,
      'Tháng 6': 0,
      'Tháng 7': 0,
      'Tháng 8': 0,
      'Tháng 9': 0,
      'Tháng 10': 0,
      'Tháng 11': 0,
      'Tháng 12': 0,
    };
    let totalRevenue = 0;
    let minRevenue: { month: string; revenue: number } | null = null;
    let maxRevenue: { month: string; revenue: number } | null = null;
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
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeService.findByUserId(userId);
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const data = await this.billModel.aggregate(BillGetCountCharityByYearREQ.toQueryCondition(store._id, year));
    const monthlyCharity = {
      'Tháng 1': 0,
      'Tháng 2': 0,
      'Tháng 3': 0,
      'Tháng 4': 0,
      'Tháng 5': 0,
      'Tháng 6': 0,
      'Tháng 7': 0,
      'Tháng 8': 0,
      'Tháng 9': 0,
      'Tháng 10': 0,
      'Tháng 11': 0,
      'Tháng 12': 0,
    };
    let totalGive = 0;
    let minGive: { month: string; numOfGive: number } | null = null;
    let maxGive: { month: string; numOfGive: number } | null = null;
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
    const data = await this.billModel.aggregate(BillGetCalculateTotalByYearREQ.toQueryCondition(year));
    const monthlyRevenue = {
      'Tháng 1': 0,
      'Tháng 2': 0,
      'Tháng 3': 0,
      'Tháng 4': 0,
      'Tháng 5': 0,
      'Tháng 6': 0,
      'Tháng 7': 0,
      'Tháng 8': 0,
      'Tháng 9': 0,
      'Tháng 10': 0,
      'Tháng 11': 0,
      'Tháng 12': 0,
    };
    let totalRevenue = 0;
    let minRevenue: { month: string; revenue: number } | null = null;
    let maxRevenue: { month: string; revenue: number } | null = null;
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
    const totalRevenueAllTime = await this.billModel.aggregate(BillGetRevenueStoreREQ.toQueryRevenueAllTime(storeId));
    const totalDelivered = await this.billModel.countDocuments({ storeId, status: 'DELIVERED' });
    return BaseResponse.withMessage(
      { totalRevenue: totalRevenueAllTime[0]?.totalRevenue || 0, totalDelivered },
      'Lấy dữ liệu thành công!',
    );
  }

  async getMyBill(userId: string, billId: string) {
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
      products: {
        $elemMatch: {
          id: productId.toString(),
          type: type.toUpperCase(),
        },
      },
      status: status.toUpperCase(),
    });
  }

  async checkProductPurchased(productId: string) {
    const bill = await this.billModel.findOne({
      products: {
        $elemMatch: {
          id: productId.toString(),
        },
      },
    });
    return bill ? true : false;
  }

  async checkProductPurchasedByUser(userId: string, productId: string) {
    const bill = await this.billModel.findOne({
      userId,
      products: {
        $elemMatch: {
          id: productId.toString(),
        },
      },
    });
    return bill ? true : false;
  }
}
