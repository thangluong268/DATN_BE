import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { ShipperCreateREQ } from './request/shipper-create.request';
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
    return BaseResponse.withMessage({}, 'Tạo thông tin shipper thành công');
  }
}
