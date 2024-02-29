import { Module } from '@nestjs/common';
import { PayPalController } from './paypal/paypal.controller';
import { PaypalPaymentService } from './paypal/paypal.service';
import { VNPayController } from './vn-pay/vn-pay.controller';

@Module({
  imports: [],
  controllers: [VNPayController, PayPalController],
  providers: [PaypalPaymentService],
})
export class PaymentModule {}
