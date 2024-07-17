import { BadRequestException, Injectable } from '@nestjs/common';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { PaymentDTO } from './dto/payment.dto';
import { PaymentProposeGateway } from './payment-propose.gateway';

@Injectable()
export class PaymentProposeService {
  public registerPaymentProposeGateway = new Map<PAYMENT_METHOD, PaymentProposeGateway>();

  public async processPayment(bill: PaymentDTO, paymentMethod: PAYMENT_METHOD) {
    const gateway = this.registerPaymentProposeGateway.get(paymentMethod);
    if (!gateway) {
      throw new BadRequestException('Payment method is not supported');
    }
    return await gateway.processPayment(bill);
  }
}
