import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { ShipperCreateREQ } from './request/shipper-create.request';
import { ShipperInActiveGetREQ } from './request/shipper-inactive-get.request';
import { ShipperInActiveRESP } from './response/shipper-inactive.response';
import { Shipper } from './schema/shipper.schema';

@Injectable()
export class ShipperService {
  private readonly logger = new Logger(ShipperService.name);
  constructor(
    @InjectModel(Shipper.name)
    private readonly shipperModel: Model<Shipper>,
  ) {}

  async create(body: ShipperCreateREQ) {
    this.logger.log(`Create shipper`);
    const checkEmailExist = await this.shipperModel.findOne({ email: body.email }).lean();
    if (checkEmailExist) throw new ConflictException('Email đã tồn tại');
    const checkPhoneExist = await this.shipperModel.findOne({ phone: body.phone }).lean();
    if (checkPhoneExist) throw new ConflictException('Số điện thoại đã tồn tại');
    await this.shipperModel.create(body);
    await this;
    return BaseResponse.withMessage({}, 'Tạo thông tin shipper thành công');
  }

  async getShippersInActive(query: ShipperInActiveGetREQ) {
    this.logger.log(`get shippers in-active`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const condition = ShipperInActiveGetREQ.toCondition(query);
    const [data, total] = await Promise.all([
      this.shipperModel.find(condition).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.shipperModel.countDocuments(condition),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(
      data.map((shipper) => ShipperInActiveRESP.of(shipper)),
      total,
      'Lấy thông tin tài khoản shipper chưa kích hoạt thành công',
    );
  }
}
