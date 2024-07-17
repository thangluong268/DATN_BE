import { Module, forwardRef } from '@nestjs/common';
import { BillModule } from 'domains/bill/bill.module';
import { ProposeModule } from 'domains/propose/propose.module';
import { PaymentProposeService } from './payment-propose.service';
import { PaymentService } from './payment.service';
import { PayPalController } from './paypal/paypal.controller';
import { PaypalPaymentService } from './paypal/paypal.service';
import { VNPayController } from './vn-pay/vn-pay.controller';

@Module({
  imports: [forwardRef(() => BillModule), forwardRef(() => ProposeModule)],
  controllers: [VNPayController, PayPalController],
  providers: [PaypalPaymentService, PaymentService, PaymentProposeService],
  exports: [PaypalPaymentService, PaymentService, PaymentProposeService],
})
export class PaymentModule {}
