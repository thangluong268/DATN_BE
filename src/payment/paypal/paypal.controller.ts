import { Controller, Get, Req, Res } from '@nestjs/common';
import { HOST_URL } from 'app.config';
import { BillService } from 'domains/bill/bill.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';

@Controller('paypal')
export class PayPalController {
  constructor(
    private readonly paypalPaymentService: PaypalPaymentService,
    private readonly billService: BillService,
  ) {}

  @Get('payment/callback')
  async callBackPayPal(@Req() req, @Res() res) {
    const orderId = req.query.token;
    const data = await this.paypalPaymentService.capturePayPalPayment(orderId);
    const paymentId = data.purchase_units[0].reference_id;
    console.log(paymentId);
    if (data.status !== 'COMPLETED') {
      await this.billService.handleBillFail(paymentId);
      res.redirect(`${HOST_URL}/payment/fail`);
    } else {
      await this.billService.handleBillSuccess(paymentId);
      res.redirect(`${HOST_URL}/payment/success`);
    }
  }
}
