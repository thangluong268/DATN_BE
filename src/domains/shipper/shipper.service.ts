import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SALT_ROUNDS } from 'app.config';
import * as bcrypt from 'bcrypt';
import { User } from 'domains/user/schema/user.schema';
import { Model } from 'mongoose';
import { MailService } from 'services/mail/mail.service';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { generatePassword } from 'shared/helpers/generate-password.helper';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { ShipperActiveREQ } from './request/shipper-active.request';
import { ShipperCreateREQ } from './request/shipper-create.request';
import { ShipperInActiveGetREQ } from './request/shipper-inactive-get.request';
import { ShipperInActiveRESP } from './response/shipper-inactive.response';

@Injectable()
export class ShipperService {
  private readonly logger = new Logger(ShipperService.name);
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    private readonly mailService: MailService,
  ) {}

  async create(body: ShipperCreateREQ) {
    this.logger.log(`Create shipper`);
    const shipper = await this.userModel.findOne({ email: body.email, role: ROLE_NAME.SHIPPER }).lean();
    if (shipper) throw new ConflictException('Email đã tồn tại!');
    await this.userModel.create(ShipperCreateREQ.toCreate(body));
    return BaseResponse.withMessage({}, 'Đăng ký thành công!');
  }

  async getShippersInActive(query: ShipperInActiveGetREQ) {
    this.logger.log(`get shippers in-active`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const condition = ShipperInActiveGetREQ.toCondition(query);
    const [data, total] = await Promise.all([
      this.userModel.find(condition).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.userModel.countDocuments(condition),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(
      data.map((shipper) => ShipperInActiveRESP.of(shipper)),
      total,
      'Lấy thông tin tài khoản shipper chưa kích hoạt thành công',
    );
  }

  async activeAccount(id: string, body: ShipperActiveREQ) {
    this.logger.log(`Active account shipper`);
    const { email } = body;
    const checkEmailShipperExist = await this.userModel.findOne({ email, role: ROLE_NAME.SHIPPER }).lean();
    if (checkEmailShipperExist) throw new ConflictException('Email đã tồn tại');
    const shipper = await this.userModel.findById(id).lean();
    const password = generatePassword();
    console.log(password);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await this.userModel.findByIdAndUpdate(id, { email, password: hashedPassword, status: true });
    this.mailService.sendActiveShipper(shipper.emailShipper, email, password);
    return BaseResponse.withMessage({}, 'Mở tài khoản shipper thành công');
  }
}
