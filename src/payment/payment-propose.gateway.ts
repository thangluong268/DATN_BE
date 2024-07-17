import { PaymentDTO } from './dto/payment.dto';
import { PaypalPaymentService } from './paypal/paypal.service';
import { createVNPayPaymentPropose } from './vn-pay/vn-pay.service';

export abstract class PaymentProposeGateway {
  abstract processPayment(bill: PaymentDTO): any;
}

export class VNPayProposeGateway implements PaymentProposeGateway {
  async processPayment(bill: PaymentDTO) {
    return await createVNPayPaymentPropose(bill);
  }
}

export class PaypalProposeGateway implements PaymentProposeGateway {
  constructor(private readonly paypalPaymentService: PaypalPaymentService) {}
  async processPayment(bill: PaymentDTO) {
    return await this.paypalPaymentService.createPayPalPaymentPropose(bill);
  }
}
