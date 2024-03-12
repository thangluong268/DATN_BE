import { Module, forwardRef } from '@nestjs/common';
import { BillModule } from 'domains/bill/bill.module';
import { PaymentService } from './payment.service';
import { PayPalController } from './paypal/paypal.controller';
import { PaypalPaymentService } from './paypal/paypal.service';
import { VNPayController } from './vn-pay/vn-pay.controller';

@Module({
  imports: [forwardRef(() => BillModule)],
  controllers: [VNPayController, PayPalController],
  providers: [PaypalPaymentService, PaymentService],
  exports: [PaypalPaymentService, PaymentService],
})
export class PaymentModule {}
