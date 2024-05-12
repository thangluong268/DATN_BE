import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SALT_ROUNDS, TAX_RATE } from 'app.config';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';
import { Bill } from 'domains/bill/schema/bill.schema';
import { Finance } from 'domains/finance/schema/finance.schema';
import { Tax } from 'domains/tax/schema/tax.schema';
import { UserBillTracking } from 'domains/user-bill-tracking/schema/user-bill-tracking.schema';
import { UserBillTrackingService } from 'domains/user-bill-tracking/user-bill-tracking.service';
import { User } from 'domains/user/schema/user.schema';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { MailService } from 'services/mail/mail.service';
import { NUM_OF_ALLOW_DELIVERING_BILL } from 'shared/constants/bill.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { SHIPPER_BEHAVIOR_BILL } from 'shared/enums/shipper.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { createExcelFile } from 'shared/helpers/excel.helper';
import { generatePassword } from 'shared/helpers/generate-password.helper';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { ShipperDownloadExcelDTO } from './dto/shipper-download-excel.dto';
import { ShipperActiveREQ } from './request/shipper-active.request';
import { ShipperBehaviorBillREQ } from './request/shipper-behavior-bill.request';
import { BillByStatusShipperGetREQ } from './request/shipper-bill-by-status.request';
import { ShipperChangePasswordREQ } from './request/shipper-change-password.request';
import { ShipperCreateREQ } from './request/shipper-create.request';
import { ShipperGetREQ } from './request/shipper-get.request';
import { ShipperUpdateREQ } from './request/shipper-update.request';
import { ShipperRESP } from './response/shipper-inactive.response';
import { ShipperProfileRESP } from './response/shipper-profile.response';

@Injectable()
export class ShipperService {
  private readonly logger = new Logger(ShipperService.name);
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Bill.name)
    private readonly billModel: Model<Bill>,

    @InjectModel(Tax.name)
    private readonly taxModel: Model<Tax>,

    @InjectModel(Finance.name)
    private readonly financeModel: Model<Finance>,

    @InjectModel(UserBillTracking.name)
    private readonly userBillTrackingModel: Model<UserBillTracking>,

    private readonly userBillTrackingService: UserBillTrackingService,

    private readonly mailService: MailService,
  ) {}

  async create(body: ShipperCreateREQ) {
    this.logger.log(`Create shipper`);
    const shipper = await this.userModel.findOne({ email: body.email, role: ROLE_NAME.SHIPPER }).lean();
    if (shipper) throw new ConflictException('Email đã tồn tại!');
    await this.userModel.create(ShipperCreateREQ.toCreate(body));
    return BaseResponse.withMessage({}, 'Đăng ký thành công!');
  }

  async getShippers(query: ShipperGetREQ) {
    this.logger.log(`get shippers`);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const condition = ShipperGetREQ.toCondition(query);
    const [data, total] = await Promise.all([
      this.userModel.find(condition).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.userModel.countDocuments(condition),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(
      data.map((shipper) => ShipperRESP.of(shipper)),
      total,
      'Lấy thông tin tài khoản shipper thành công',
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

  async findShippersToDelivery(billId: string) {
    this.logger.log(`Find shipper to delivery`);
    const bill = await this.billModel.findById(billId).lean();
    if (!bill) throw new NotFoundException('Không tìm thấy đơn hàng');
    const shipperIds = await this.selectShipper();
    await this.billModel.findByIdAndUpdate(billId, { isFindShipper: true, shipperIds });
    return BaseResponse.withMessage({}, 'Tìm shipper giao hàng thành công');
  }

  private async selectShipper() {
    this.logger.log(`Select shipper`);
    const shippers = await this.userModel.aggregate([
      { $match: { role: ROLE_NAME.SHIPPER, status: true } },
      { $sample: { size: 3 } },
      { $project: { _id: 1 } },
    ]);
    return shippers.map((shipper) => shipper._id.toString());
  }

  async getBillsByStatus(userId: string, query: BillByStatusShipperGetREQ) {
    this.logger.log(`Get bills shipper by status`);
    const [data, total] = await Promise.all([
      this.billModel.aggregate(BillByStatusShipperGetREQ.toFind(userId, query) as any),
      this.billModel.countDocuments(BillByStatusShipperGetREQ.toCount(userId, query)),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách đơn hàng thành công!');
  }

  async getMyProfile(userId: string) {
    this.logger.log(`Get my profile`);
    const shipper = await this.userModel.findById(userId).lean();
    if (!shipper) throw new NotFoundException('Tài khoản không tồn tại!');
    return BaseResponse.withMessage(ShipperProfileRESP.of(shipper), 'Lấy thông tin tài khoản thành công');
  }

  async updateProfile(userId: string, body: ShipperUpdateREQ) {
    this.logger.log(`Update shipper`);
    const updatedShipper = await this.userModel.findByIdAndUpdate(userId, body, { lean: true, new: true });
    return BaseResponse.withMessage(ShipperProfileRESP.of(updatedShipper), 'Cập nhật thông tin tài khoản thành công');
  }

  async changePassword(userId: string, body: ShipperChangePasswordREQ) {
    this.logger.log(`Change password shipper`);
    const { oldPassword, newPassword } = body;
    const shipper = await this.userModel.findById(userId).lean();
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const isMatched = await bcrypt.compare(oldPassword, shipper.password);
    if (!isMatched) throw new BadRequestException('Mật khẩu cũ không chính xác!');
    await this.userModel.findByIdAndUpdate(userId, { password: hashedNewPassword });
    return BaseResponse.withMessage({}, 'Đổi mật khẩu thành công!');
  }

  async behaviorBill(userId: string, billId: string, body: ShipperBehaviorBillREQ) {
    this.logger.log(`Behavior bill by shipper`);
    const { behavior, reason } = body;
    switch (behavior) {
      case SHIPPER_BEHAVIOR_BILL.ACCEPT:
        return await this.acceptBillToDelivery(userId, billId);
      case SHIPPER_BEHAVIOR_BILL.REFUSE:
        return await this.refuseBillToDelivery(userId, billId);
      case SHIPPER_BEHAVIOR_BILL.CONFIRM_DELIVERED:
        return await this.confirmDeliveredBill(userId, billId);
      case SHIPPER_BEHAVIOR_BILL.BACK:
        return await this.backBill(userId, billId, reason);
      default:
        break;
    }
  }

  async acceptBillToDelivery(userId: string, billId: string) {
    this.logger.log(`Accept bill to delivery`);
    const bill = await this.billModel
      .findOne({ _id: new ObjectId(billId), status: BILL_STATUS.CONFIRMED, isFindShipper: true, shipperIds: userId })
      .lean();
    if (!bill) throw new NotFoundException('Đơn hàng không hợp lệ!');
    const isAllow = await this.isAllowNumOfDeliveringBill(userId);
    if (!isAllow) throw new BadRequestException('Không thể nhận quá 5 đơn hàng cùng lúc!');
    await this.billModel.findByIdAndUpdate(billId, {
      status: BILL_STATUS.DELIVERING,
      isFindShipper: false,
      shipperIds: [userId],
    });
    return BaseResponse.withMessage({}, 'Nhận đơn hàng thành công');
  }

  async isAllowNumOfDeliveringBill(userId: string) {
    const count = await this.billModel.countDocuments({
      shipperIds: userId,
      status: BILL_STATUS.DELIVERING,
      isShipperConfirmed: false,
    });
    return count <= NUM_OF_ALLOW_DELIVERING_BILL;
  }

  async refuseBillToDelivery(userId: string, billId: string) {
    this.logger.log(`Refuse bill to delivery`);
    const bill = await this.billModel
      .findOne({ _id: new ObjectId(billId), status: BILL_STATUS.CONFIRMED, isFindShipper: true, shipperIds: userId })
      .lean();
    if (!bill) throw new NotFoundException('Đơn hàng không hợp lệ!');
    await this.billModel.findByIdAndUpdate(billId, { $pull: { shipperIds: userId } });
    await this.userBillTrackingModel.findOneAndUpdate(
      { shipperId: userId },
      { $inc: { numOfRefund: 1 }, status: BILL_STATUS.CANCELLED },
      { upsert: true, new: true },
    );
    return BaseResponse.withMessage({}, 'Từ chối đơn hàng thành công');
  }

  async confirmDeliveredBill(userId: string, billId: string) {
    this.logger.log(`Confirm delivered bill`);
    const bill = await this.billModel
      .findOne({ _id: new ObjectId(billId), status: BILL_STATUS.DELIVERING, shipperIds: userId })
      .lean();
    if (!bill) throw new NotFoundException('Đơn hàng không hợp lệ!');
    await this.billModel.findByIdAndUpdate(billId, { isShipperConfirmed: true });
    const taxFee = Math.ceil(bill.deliveryFee * TAX_RATE);
    await this.taxModel.create({ shipperId: userId, totalPrice: bill.deliveryFee, taxFee, paymentId: bill.paymentId });
    await this.financeModel.create({ revenue: taxFee });
    return BaseResponse.withMessage({}, 'Xác nhận giao hàng thành công!');
  }

  async backBill(shipperId: string, billId: string, reason: string) {
    this.logger.log(`Back Bill: ${billId}`);
    const bill = await this.billModel.findOne({
      _id: new ObjectId(billId),
      status: BILL_STATUS.DELIVERING,
      shipperIds: shipperId,
    });
    if (!bill) throw new NotFoundException('Đơn hàng không hợp lệ!');
    const userId = bill.userId;
    await this.userBillTrackingService.checkUserNotAllowDoBehavior(userId, BILL_STATUS.BACK);
    bill.status = BILL_STATUS.BACK;
    bill.reason = reason;
    await bill.save();
    await this.userBillTrackingService.handleUserBillTracking(userId, BILL_STATUS.BACK);
    return BaseResponse.withMessage({}, 'Trả đơn hàng thành công!');
  }

  /**
   * Excel download
   */
  async downloadExcelShipper() {
    this.logger.log(`Download Excel Shippers`);
    const shippers = await this.userModel
      .find({ role: { $in: [ROLE_NAME.SHIPPER] }, status: true })
      .sort({ createdAt: -1 })
      .lean();
    const headers = ShipperDownloadExcelDTO.getSheetValue();
    const dataRows = shippers.map(ShipperDownloadExcelDTO.fromEntity);
    return createExcelFile<ShipperDownloadExcelDTO>(`Shippers - ${dayjs().format('YYYY-MM-DD')}`, headers, dataRows);
  }
}
