import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { Product } from 'domains/product/schema/product.schema';
import { ProposeGetProductREQ } from 'domains/propose/request/propose-get-product.request';
import { Store } from 'domains/store/schema/store.schema';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { StorePropose } from './schema/store-propose.schema';

@Injectable()
export class StoreProposeService {
  private readonly logger = new Logger(StoreProposeService.name);
  constructor(
    @InjectModel(StorePropose.name)
    private readonly storeProposeModel: Model<StorePropose>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async getStoreProposes() {
    this.logger.log(`Get store proposes`);
    const storeProposes = await this.storeProposeModel.find().sort({ createdAt: -1 }).lean();
    const data = storeProposes.map((storePropose) => {
      return {
        storeId: storePropose.storeId,
        storeAvatar: storePropose.storeAvatar,
        storeName: storePropose.storeName,
        storeAddress: storePropose.storeAddress,
        storePhoneNumber: storePropose.storePhoneNumber,
        proposeId: storePropose.proposeId,
        title: storePropose.title,
        price: storePropose.price,
        timePackage: storePropose.timePackage,
        startTime: storePropose['createdAt'],
        endTime: dayjs(storePropose['createdAt']).add(storePropose.timePackage, 'days').toDate(),
      };
    });
    return BaseResponse.withMessage(data, 'Lấy danh sách cửa hàng đã mua gói đề xuất thành công');
  }

  async getMyPropose(userReq: any) {
    this.logger.log(`Get my propose`);
    const store = await this.storeModel.findOne({ userId: userReq._id.toString() }).lean();
    const storePropose = await this.storeProposeModel.findOne({ storeId: store._id.toString() }).lean();
    if (!storePropose) return BaseResponse.withMessage(null, 'Cửa hàng chưa mua gói đề xuất');
    const data = {
      proposeId: storePropose.proposeId,
      title: storePropose.title,
      price: storePropose.price,
      timePackage: storePropose.timePackage,
      startTime: storePropose['createdAt'],
      endTime: dayjs(storePropose['createdAt']).add(storePropose.timePackage, 'days').toDate(),
    };
    return BaseResponse.withMessage(data, 'Lấy gói đề xuất của cửa hàng thành công');
  }

  async getProductsPropose(query: ProposeGetProductREQ) {
    this.logger.log(`Get products propose`);
    const limit = query.limit || 10;
    const storeProposes = await this.storeProposeModel.find().sort({ createdAt: -1 }).select('storeId').lean();
    const storeIds = storeProposes.map((storePropose) => storePropose.storeId);
    const products = await this.productModel
      .find({ storeId: { $in: storeIds }, status: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return BaseResponse.withMessage(products, 'Lấy danh sách sản phẩm gợi ý thành công');
  }
}
