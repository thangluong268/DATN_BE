import { ConflictException, Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BillService } from 'domains/bill/bill.service';
import { BillSeller } from 'domains/bill/schema/bill-seller.schema';
import { Feedback } from 'domains/feedback/schema/feedback.schema';
import { Product } from 'domains/product/schema/product.schema';
import { Model } from 'mongoose';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { User } from '../user/schema/user.schema';
import { UserService } from '../user/user.service';
import { STORE_DATA } from './data/sample.data';
import { StoreCreateREQ } from './request/store-create.request';
import { GetStoresByAdminREQ } from './request/store-get-all-admin.request';
import { StoreGetHaveMostProductREQ } from './request/store-get-have-most-product.request';
import { StoreUpdateREQ } from './request/store-update.request';
import { Store } from './schema/store.schema';
import { StoreDownloadExcelDTO } from './dto/store-download-excel.dto';
import { createExcelFile } from 'shared/helpers/excel.helper';
import * as dayjs from 'dayjs';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<Feedback>,

    @InjectModel(BillSeller.name)
    private readonly billSellerModel: Model<BillSeller>,
    @Inject(forwardRef(() => BillService))
    private readonly billService: BillService,
  ) {}

  async create(userId: string, body: StoreCreateREQ) {
    this.logger.log(`Create Store: ${userId}`);
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng này!');
    const store = await this.storeModel.findOne({ userId }, {}, { lean: true });
    if (store) throw new ConflictException('Người dùng đã có cửa hàng!');
    const newStore = await this.storeModel.create({ userId, ...body });
    await this.userModel.findByIdAndUpdate(userId, { role: [...user.role, ROLE_NAME.SELLER] });
    return BaseResponse.withMessage(newStore, 'Tạo cửa hàng thành công!');
  }

  async getMyStore(userId: string) {
    this.logger.log(`Get My Store: ${userId}`);
    const store = await this.storeModel.findOne({ userId }, {}, { lean: true });
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    return BaseResponse.withMessage(store, 'Lấy thông tin cửa hàng thành công!');
  }

  async getStores(query: GetStoresByAdminREQ) {
    this.logger.log(`Get Stores: ${JSON.stringify(query)}`);
    const condition = GetStoresByAdminREQ.toQueryCondition(query);
    const [data, total] = await Promise.all([
      this.storeModel.aggregate(GetStoresByAdminREQ.toFind(query) as any),
      this.storeModel.countDocuments(condition),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách cửa hàng thành công!');
  }

  async getStoreReputation(userReq: any, storeId: string) {
    this.logger.log(`Get Store Reputation: ${storeId}`);
    const store = await this.storeModel.findById(storeId, {}, { lean: true });
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const productIds = (await this.productModel.find({ storeId }, { _id: 1 }).lean()).map((item) => item._id.toString());
    const feedbacks = await this.feedbackModel.find({ productId: { $in: productIds } }, { star: 1 }).lean();
    let totalFeedback = 0;
    let totalAverageStar = 0;
    for (const feedback of feedbacks) {
      totalFeedback++;
      totalAverageStar += feedback.star;
    }
    const averageStarOfStore = totalFeedback > 0 ? Number((totalAverageStar / totalFeedback).toFixed(2)) : 0;
    const totalFollow = await this.userModel.countDocuments({ followStores: storeId });
    let isFollow = false;
    if (userReq) {
      const user = await this.userService.findById(userReq.userId);
      isFollow = user.followStores.includes(storeId);
    }
    return BaseResponse.withMessage(
      { averageStar: averageStarOfStore, totalFeedback, totalFollow, isFollow },
      'Lấy thông tin độ uy tín cửa hàng thành công!',
    );
  }

  async getStoresHaveMostProduct(query: StoreGetHaveMostProductREQ) {
    this.logger.log(`Get Stores Have Most Product: ${JSON.stringify(query)}`);
    const stores = await this.productModel.aggregate(StoreGetHaveMostProductREQ.toQueryCondition(query) as any);
    const data = await Promise.all(
      stores.map(async (item) => {
        const store = await this.storeModel.findById(item._id, { status: 0, updatedAt: 0 }, { lean: true });
        if (!store) return;
        return { store, totalProducts: item.count };
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy thông tin danh sách cửa hàng có nhiều sản phẩm nhất thành công!');
  }

  async getStoreByManager(storeId: string) {
    this.logger.log(`Get Store By Manager: ${storeId}`);
    const store = await this.storeModel.findById(storeId).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const productIds = (await this.productModel.find({ storeId }, { _id: 1 }).lean()).map((item) => item._id.toString());
    const feedbacks = await this.feedbackModel.find({ productId: { $in: productIds } }, { star: 1 }).lean();
    let totalFeedback = 0;
    let totalAverageStar = 0;
    for (const feedback of feedbacks) {
      totalFeedback++;
      totalAverageStar += feedback.star;
    }
    const averageStarOfStore = totalFeedback > 0 ? Number((totalAverageStar / totalFeedback).toFixed(2)) : 0;
    const totalFollow = await this.userModel.countDocuments({ followStores: storeId });
    const totalRevenue = await this.billService.calculateRevenueAllTimeByStoreId(storeId);
    const totalDelivered = await this.billSellerModel.countDocuments({ storeId, status: BILL_STATUS.DELIVERED });
    return BaseResponse.withMessage(
      { store, averageStar: averageStarOfStore, totalFeedback, totalFollow, totalRevenue, totalDelivered },
      'Lấy thông tin cửa hàng thành công!',
    );
  }

  async getStoresByManager() {
    this.logger.log(`Get Stores By Manager`);
    const stores = await this.storeModel.find().lean();
    const data = await Promise.all(
      stores.map(async (item) => {
        const storeId = item._id.toString();
        const store = await this.storeModel.findById(storeId).lean();
        const productIds = (await this.productModel.find({ storeId }, { _id: 1 }).lean()).map((item) => item._id.toString());
        const feedbacks = await this.feedbackModel.find({ productId: { $in: productIds } }, { star: 1 }).lean();
        let totalFeedback = 0;
        let totalAverageStar = 0;
        for (const feedback of feedbacks) {
          totalFeedback++;
          totalAverageStar += feedback.star;
        }
        const averageStarOfStore = totalFeedback > 0 ? Number((totalAverageStar / totalFeedback).toFixed(2)) : 0;
        const totalFollow = await this.userModel.countDocuments({ followStores: storeId });
        const totalRevenue = await this.billService.calculateRevenueAllTimeByStoreId(storeId);
        const totalDelivered = await this.billSellerModel.countDocuments({ storeId, status: BILL_STATUS.DELIVERED });
        return { store, averageStar: averageStarOfStore, totalFeedback, totalFollow, totalRevenue, totalDelivered };
      }),
    );
    return BaseResponse.withMessage(data, 'Lấy danh sách cửa hàng thành công!');
  }

  async getStoreById(storeId: string) {
    this.logger.log(`Get Store By Id: ${storeId}`);
    const store = await this.storeModel.findOne({ _id: storeId, status: true }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    const productIds = (await this.productModel.find({ storeId }, { _id: 1 }).lean()).map((item) => item._id.toString());
    const feedbacks = await this.feedbackModel.find({ productId: { $in: productIds } }, { star: 1 }).lean();
    let totalFeedback = 0;
    let totalAverageStar = 0;
    for (const feedback of feedbacks) {
      totalFeedback++;
      totalAverageStar += feedback.star;
    }
    const averageStarOfStore = totalFeedback > 0 ? Number((totalAverageStar / totalFeedback).toFixed(2)) : 0;
    const totalFollow = await this.userModel.countDocuments({ followStores: storeId });
    const totalRevenue = await this.billService.calculateRevenueAllTimeByStoreId(storeId);
    const totalDelivered = await this.billSellerModel.countDocuments({ storeId, status: BILL_STATUS.DELIVERED });
    return BaseResponse.withMessage(
      { store, averageStar: averageStarOfStore, totalFeedback, totalFollow, totalRevenue, totalDelivered },
      'Lấy thông tin cửa hàng thành công!',
    );
  }

  async getStoresBanned(query: PaginationREQ) {
    this.logger.log(`Get Stores Banned`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const total = await this.storeModel.countDocuments({ status: false });
    const data = await this.storeModel.find({ status: false }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách cửa hàng bị vô hiệu hóa thành công!');
  }

  async update(userId: string, body: StoreUpdateREQ) {
    this.logger.log(`Update Store: ${userId}`);
    const store = await this.storeModel.findOne({ userId }, {}, { lean: true });
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng!');
    const updatedStore = await this.storeModel.findOneAndUpdate({ userId }, { ...body }, { lean: true, new: true });
    return BaseResponse.withMessage<Store>(updatedStore, 'Cập nhật thông tin cửa hàng thành công!');
  }

  async unBanStore(storeId: string) {
    this.logger.log(`UnBan Store: ${storeId}`);
    const store = await this.storeModel.findOne({ _id: storeId, status: false }).lean();
    if (!store) throw new NotFoundException('Không tìm thấy cửa hàng này!');
    await this.storeModel.findByIdAndUpdate(storeId, { status: true });
    return BaseResponse.withMessage({}, 'Mở khóa cửa hàng thành công!');
  }

  async findByUserId(userId: string) {
    return await this.storeModel.findOne({ userId }, {}, { lean: true });
  }

  async findById(id: string) {
    return await this.storeModel.findById(id, {}, { lean: true });
  }

  async countTotal() {
    return await this.storeModel.countDocuments();
  }

  async getStoresSelect() {
    this.logger.log(`Get Stores Select`);
    const stores = await this.storeModel.find({ status: true }, { name: 1, _id: 1 }).lean();
    return BaseResponse.withMessage(stores, 'Lấy danh sách cửa hàng thành công!');
  }

  /**
   * Excel Download
   */

  async downloadExcelStores() {
    this.logger.log(`Download Excel Stores`);
    const stores = await this.storeModel.aggregate([
      { $addFields: { userObjId: { $toObjectId: '$userId' } } },
      { $lookup: { from: 'users', localField: 'userObjId', foreignField: '_id', as: 'user' } },
      { $addFields: { userName: { $first: '$user.fullName' } } },
      { $sort: { createdAt: -1 } },
      { $project: { userObjId: 0, user: 0 } },
    ]);
    const headers = StoreDownloadExcelDTO.getSheetValue();
    const dataRows = stores.map(StoreDownloadExcelDTO.fromEntity);
    return createExcelFile<StoreDownloadExcelDTO>(`Stores - ${dayjs().format('YYYY-MM-DD')}`, headers, dataRows);
  }

  /**
   * This is part of scraping data
   */

  async scrapingData() {
    this.logger.log(`Seed Data Store`);
    const users = await this.userModel.find({}, { _id: 1, phone: 1 }, { lean: true }).skip(1).limit(10);
    const data = STORE_DATA.map((item, index) => ({
      ...item,
      userId: users[users.length - 1 - index]._id.toString(),
      avatar: 'https://static.vecteezy.com/system/resources/previews/010/879/093/original/store-3d-icon-png.png',
      phoneNumber: users[index].phone,
    }));
    await this.storeModel.insertMany(data);
    await this.userModel.updateMany({ _id: { $in: users.map((item) => item._id) } }, { $push: { role: ROLE_NAME.SELLER } });
  }
}
