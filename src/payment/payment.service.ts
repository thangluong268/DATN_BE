import { BadRequestException, Injectable } from '@nestjs/common';
import { PAYMENT_METHOD } from 'shared/enums/bill.enum';
import { PaymentDTO } from './dto/payment.dto';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
  public registerPaymentGateway = new Map<PAYMENT_METHOD, PaymentGateway>();

  public async processPayment(bill: PaymentDTO, paymentMethod: PAYMENT_METHOD) {
    const gateway = this.registerPaymentGateway.get(paymentMethod);
    if (!gateway) {
      throw new BadRequestException('Payment method is not supported');
    }
    return await gateway.processPayment(bill);
  }
}
