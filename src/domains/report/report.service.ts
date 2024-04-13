import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from 'domains/product/schema/product.schema';
import { Store } from 'domains/store/schema/store.schema';
import { User } from 'domains/user/schema/user.schema';
import { Model } from 'mongoose';
import { MailService } from 'services/mail/mail.service';
import { PolicyType } from 'shared/enums/policy.enum';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { PaginationResponse } from 'shared/generics/pagination.response';
import { toDocModel } from 'shared/helpers/to-doc-model.helper';
import { ReportCreateREQ } from './request/report-create.request';
import { ReportGetREQ } from './request/report-get.request';
import { Report } from './schema/report.schema';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    private readonly mailService: MailService,
  ) {}

  async create(userId: string, body: ReportCreateREQ) {
    this.logger.log(`create: ${JSON.stringify(body)}`);
    const isExist = await this.reportModel.exists({ userId, subjectId: body.subjectId });
    if (isExist) throw new ConflictException('Bạn đã báo cáo về nội dung này rồi!');
    const newReport = await this.reportModel.create({ ...body, userId });
    return BaseResponse.withMessage(toDocModel(newReport), 'Tạo báo cáo thành công!');
  }

  async getReports(query: ReportGetREQ) {
    this.logger.log(`get reports: ${JSON.stringify(query)}`);
    const conditionTotal = ReportGetREQ.toQueryCondition(query);
    const conditionFind = ReportGetREQ.toFind(query);
    const [data, total] = await Promise.all([
      this.reportModel.aggregate(conditionFind as any),
      this.reportModel.countDocuments(conditionTotal),
    ]);
    return PaginationResponse.ofWithTotalAndMessage(data, total, 'Lấy danh sách báo cáo thành công!');
  }

  async getReportById(id: string) {
    this.logger.log(`get report by id: ${id}`);
    const report = await this.reportModel.findById(id).lean();
    if (!report) throw new NotFoundException('Báo cáo không tồn tại!');
    const collectionFrom = report.type === PolicyType.PRODUCT ? 'products' : 'stores';
    const data = await this.reportModel.aggregate([
      { $match: { _id: report._id } },
      { $addFields: { userObjId: { $toObjectId: '$userId' } } },
      { $addFields: { subjectObjId: { $toObjectId: '$subjectId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: collectionFrom,
          localField: 'subjectObjId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$user' },
      { $unwind: '$subject' },
      {
        $project: {
          _id: 0,
          report: {
            _id: '$_id',
            content: '$content',
            createdAt: '$createdAt',
          },
          userReport: {
            _id: '$user._id',
            fullName: '$user.fullName',
            email: '$user.email',
            avatar: '$user.avatar',
            gender: '$user.gender',
          },
          subject: '$subject',
        },
      },
    ]);
    return BaseResponse.withMessage(data[0], 'Lấy thông tin báo cáo thành công!');
  }

  async approval(id: string) {
    this.logger.log(`Approval report: ${id}`);
    const report = await this.reportModel.findById(id).lean();
    if (!report) throw new NotFoundException('Báo cáo không tồn tại!');
    if (report.status === true) throw new BadRequestException('Báo cáo đã được xử lý!');
    await this.reportModel.findByIdAndUpdate(id, { status: true });
    const totalOfSubjectReport = await this.reportModel.countDocuments({ subjectId: report.subjectId });
    if (report.type === PolicyType.PRODUCT) {
      await this.handleReportProduct(report.subjectId, totalOfSubjectReport);
    } else if (report.type === PolicyType.STORE) {
      await this.handleReportStore(report.subjectId, totalOfSubjectReport);
    }
    await this.removeRemainingReport(report.subjectId);
    return BaseResponse.withMessage({}, 'Chấp thuận báo cáo thành công!');
  }

  async removeRemainingReport(subjectId: string) {
    this.logger.log(`Remove remaining report: ${subjectId}`);
    await this.reportModel.deleteMany({ subjectId, status: false });
  }

  async handleReportProduct(productId: string, totalOfSubjectReport: number) {
    this.logger.log(`Handle report product: ${productId}`);
    const product = await this.productModel.findById(productId).lean();
    const store = await this.storeModel.findById(product.storeId).lean();
    const user = await this.userModel.findById(store.userId).lean();
    await this.productModel.findByIdAndUpdate(productId, { status: false });
    const numOfReportProductInStore = await this.reportModel.aggregate([
      { $match: { subjectId: productId, type: PolicyType.PRODUCT, status: true } },
      { $addFields: { subjectObjId: { $toObjectId: '$subjectId' } } },
      {
        $lookup: {
          from: 'products',
          localField: 'subjectObjId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $addFields: { storeObjId: { $toObjectId: '$product.storeId' } } },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeObjId',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      { $match: { 'store._id': store._id } },
      {
        $group: {
          _id: '$store._id',
          total: { $sum: 1 },
        },
      },
    ]);
    if (numOfReportProductInStore[0].total === 3) {
      const content = `Tổng số lượng báo cáo về sản phẩm: ${product.name} là: ${totalOfSubjectReport} lần.
      Chúng tôi sẽ ẩn sản phẩm : ${product.name} để bảo vệ quyền lợi của người tiêu dùng.
      Số lần cảnh báo của cửa hàng: ${store.warningCount + 1} lần.
      Cửa hàng của bạn sẽ bị vô hiệu hóa khi số lần cảnh báo đạt 3 lần.
      Vui lòng liên hệ với quản trị viên để biết thêm thông tin.`;
      await this.handleWarningStore(store, user, content);
    }
  }

  async handleReportStore(storeId: string, totalOfSubjectReport: number) {
    this.logger.log(`Handle report store: ${storeId}`);
    const store = await this.storeModel.findById(storeId).lean();
    const user = await this.userModel.findById(store.userId).lean();
    const content = `Tổng số lượng báo cáo về cửa hàng: ${store.name} là: ${totalOfSubjectReport} lần.
    Số lần cảnh báo của cửa hàng: ${store.warningCount + 1} lần.
    Cửa hàng của bạn sẽ bị vô hiệu hóa khi số lần cảnh báo đạt 3 lần.
    Vui lòng liên hệ với quản trị viên để biết thêm thông tin.`;
    await this.handleWarningStore(store, user, content);
  }

  async handleWarningStore(store: Store, user: User, content: string) {
    this.logger.log(`Handle warning store: ${store._id}`);
    const willUpdatedWarningCount = store.warningCount + 1;
    if (willUpdatedWarningCount === 3) {
      await this.storeModel.findByIdAndUpdate(store._id, { warningCount: willUpdatedWarningCount, status: false });
      this.mailService.sendBanStore(user.email);
    } else {
      await this.storeModel.findByIdAndUpdate(store._id, { warningCount: willUpdatedWarningCount });
      this.mailService.sendWarningStore(user.email, content);
    }
  }

  async delete(id: string) {
    this.logger.log(`Delete report: ${id}`);
    const report = await this.reportModel.findById(id).lean();
    if (!report) throw new NotFoundException('Báo cáo không tồn tại!');
    if (report.type === PolicyType.USER) {
      await this.userModel.findByIdAndUpdate(report.subjectId, { $inc: { warningCount: -1 } });
    }
    await this.reportModel.findByIdAndDelete(id);
    return BaseResponse.withMessage({}, 'Xóa báo cáo thành công!');
  }

  async getReportsByUserId(currentUser: User, userId: string) {
    this.logger.log(`get reports by user id: ${userId}`);
    if (currentUser.role.includes(ROLE_NAME.USER) && currentUser._id.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo của người khác!');
    }
    const data = await this.reportModel
      .find({ subjectId: userId, type: PolicyType.USER }, { updatedAt: 0, status: 0, userId: 0 })
      .lean()
      .sort({ updatedAt: -1 });
    return BaseResponse.withMessage(data, 'Lấy danh sách báo cáo của người dùng thành công!');
  }
}
