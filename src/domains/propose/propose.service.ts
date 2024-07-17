import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StorePropose } from 'domains/store-propose/schema/store-propose.schema';
import { Store } from 'domains/store/schema/store.schema';
import { NotificationSubjectInfoDTO } from 'gateways/notifications/dto/notification-subject-info.dto';
import { NotificationGateway } from 'gateways/notifications/notification.gateway';
import { NotificationService } from 'gateways/notifications/notification.service';
import { Model } from 'mongoose';
import { PaymentDTO } from 'payment/dto/payment.dto';
import { PaypalProposeGateway, VNPayProposeGateway } from 'payment/payment-propose.gateway';
import { PaymentProposeService } from 'payment/payment-propose.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';
import { RedisService } from 'services/redis/redis.service';
import { NOTIFICATION_LINK } from 'shared/constants/notification.constant';
import { BILL_STATUS_NOTIFICATION, PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { NotificationType } from 'shared/enums/notification.enum';
import { BaseResponse } from 'shared/generics/base.response';
import { v4 as uuid } from 'uuid';
import { ProposeBillCreateREQ } from './request/propose-bill-create.request';
import { ProposeCreateREQ } from './request/propose-create.request';
import { ProposeGetRESP } from './response/propose-get.response';
import { Propose } from './schema/propose.schema';

@Injectable()
export class ProposeService {
  private readonly logger = new Logger(ProposeService.name);
  constructor(
    @InjectModel(Propose.name)
    private readonly proposeModel: Model<Propose>,

    @InjectModel(Store.name)
    private readonly storeModel: Model<Store>,

    @InjectModel(StorePropose.name)
    private readonly storeProposeModel: Model<StorePropose>,

    private readonly redisService: RedisService,
    private readonly paymentProposeService: PaymentProposeService,
    private readonly paypalPaymentService: PaypalPaymentService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {
    this.paymentProposeService.registerPaymentProposeGateway.set(PAYMENT_METHOD.VNPAY, new VNPayProposeGateway());
    this.paymentProposeService.registerPaymentProposeGateway.set(
      PAYMENT_METHOD.PAYPAL,
      new PaypalProposeGateway(this.paypalPaymentService),
    );
  }

  async create(body: ProposeCreateREQ) {
    this.logger.log(`Create propose`);
    const newPropose = await this.proposeModel.create(body);
    return BaseResponse.withMessage(ProposeGetRESP.of(newPropose), 'Tạo gói đề xuất thành công');
  }

  async getProposes() {
    this.logger.log(`Get proposes`);
    const proposes = await this.proposeModel.find({ status: true }).sort({ createdAt: 1 });
    return BaseResponse.withMessage(
      proposes.map((propose) => ProposeGetRESP.of(propose)),
      'Lấy danh sách gói đề xuất thành công',
    );
  }

  async purchase(userReq: any, id: string, body: ProposeBillCreateREQ) {
    this.logger.log(`Purchase propose`);
    const paymentId = uuid();
    const store = await this.storeModel.findOne({ userId: userReq._id.toString() }).lean();
    const propose = await this.proposeModel.findById(id).lean();
    if (!propose) throw new NotFoundException('Không tìm thấy gói đề xuất');
    try {
      const redisClient = this.redisService.getClient();
      await redisClient.set(paymentId, JSON.stringify({ proposeId: propose._id, storeId: store._id.toString() }));
      const paymentBody = { paymentId, amount: propose.price } as PaymentDTO;
      const urlPayment = await this.paymentProposeService.processPayment(paymentBody, body.paymentMethod);
      return BaseResponse.withMessage({ urlPayment }, 'Tạo đường link thanh toán thành công!');
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async handleBillSuccess(paymentId: string) {
    this.logger.log(`Handle bill success`);
    const redisClient = this.redisService.getClient();
    const data = await redisClient.get(paymentId);
    if (data) {
      const { proposeId, storeId } = JSON.parse(data);
      const isExist = await this.storeProposeModel.exists({ storeId });
      if (isExist) {
        await this.storeProposeModel.deleteMany({ storeId });
      }
      const propose = await this.proposeModel.findById(proposeId).lean();
      const store = await this.storeModel.findById(storeId).lean();

      await this.storeProposeModel.create({
        storeId,
        storeAvatar: store.avatar,
        storeName: store.name,
        storeAddress: store.address,
        storePhoneNumber: store.phoneNumber,
        proposeId: proposeId.toString(),
        title: propose.title,
        price: propose.price,
        timePackage: propose.timePackage,
      });
      // Send notification to seller
      const subjectInfoToSeller = NotificationSubjectInfoDTO.ofProduct(propose._id.toString(), propose.title, propose.image);
      const receiverIdToSeller = store.userId;
      const linkToSeller = NOTIFICATION_LINK[BILL_STATUS_NOTIFICATION.PURCHASE_PROPOSE] + storeId;
      const billStatusToSeller = BILL_STATUS_NOTIFICATION.PURCHASE_PROPOSE;
      const notificationToSeller = await this.notificationService.create(
        receiverIdToSeller,
        subjectInfoToSeller,
        NotificationType.BILL,
        linkToSeller,
        billStatusToSeller,
        propose.title,
      );
      this.notificationGateway.sendNotification(receiverIdToSeller, notificationToSeller);
    }
  }

  async handleBillFail(paymentId: string) {
    this.logger.log(`Handle bill fail`);
    const redisClient = this.redisService.getClient();
    const data = await redisClient.get(paymentId);
    if (data) {
      await redisClient.del(paymentId);
    }
  }

  async getStoreIdByPaymentId(paymentId: string) {
    const redisClient = this.redisService.getClient();
    const data = await redisClient.get(paymentId);
    if (data) {
      const { storeId } = JSON.parse(data);
      return storeId;
    }
    return null;
  }
}
