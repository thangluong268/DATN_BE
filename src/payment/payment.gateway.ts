import { PaymentDTO } from './dto/payment.dto';
import { PaypalPaymentService } from './paypal/paypal.service';
import { createVNPayPayment } from './vn-pay/vn-pay.service';

export abstract class PaymentGateway {
  abstract processPayment(bill: PaymentDTO): any;
}

export class VNPayGateway implements PaymentGateway {
  async processPayment(bill: PaymentDTO) {
    return await createVNPayPayment(bill);
  }
}

export class PaypalGateway implements PaymentGateway {
  constructor(private readonly paypalPaymentService: PaypalPaymentService) {}
  async processPayment(bill: PaymentDTO) {
    return await this.paypalPaymentService.createPayPalPayment(bill);
  }
}

// export class MoMoGateway implements PaymentGateway {
//   processPayment(bill: CreateBillDto): number {
//     // Process momo payment
//     return 2;
//   }
// }
