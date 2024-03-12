import { Response } from 'express';
import { PaymentDTO } from './dto/payment.dto';
import { PaypalPaymentService } from './paypal/paypal.service';
import { createVNPayPayment } from './vn-pay/vn-pay.service';

export abstract class PaymentGateway {
  abstract processPayment(bill: PaymentDTO, res?: Response): any;
}

export class VNPayGateway implements PaymentGateway {
  async processPayment(bill: PaymentDTO) {
    await createVNPayPayment(bill);
  }
}

export class PaypalGateway implements PaymentGateway {
  constructor(private readonly paypalPaymentService: PaypalPaymentService) {}
  async processPayment(bill: PaymentDTO, res: Response) {
    await this.paypalPaymentService.createPayPalPayment(bill, res);
  }
}

// export class MoMoGateway implements PaymentGateway {
//   processPayment(bill: CreateBillDto): number {
//     // Process momo payment
//     return 2;
//   }
// }

// export class GiveGateway implements PaymentGateway {
//   processPayment(bill: CreateBillDto): number {
//     return 0;
//   }
// }
