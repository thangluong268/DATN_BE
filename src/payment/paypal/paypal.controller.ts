import { Controller, Get, Req, Res } from '@nestjs/common';
import { URL_FE } from 'app.config';
import { BillService } from 'domains/bill/bill.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';
import { URL_FE_BILL_SUCCESS } from 'shared/constants/bill.constant';

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
    if (data.status !== 'COMPLETED') {
      this.billService.handleBillFail(paymentId);
      res.redirect(`${URL_FE}/error`);
    } else {
      this.billService.handleBillSuccess(paymentId);
      res.redirect(URL_FE_BILL_SUCCESS);
    }
  }
}
