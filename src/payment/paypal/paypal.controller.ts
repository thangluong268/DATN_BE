import { BadRequestException, Controller, Get, Req } from '@nestjs/common';
import { BillService } from 'domains/bill/bill.service';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';

@Controller('paypal')
export class PayPalController {
  constructor(
    private readonly paypalPaymentService: PaypalPaymentService,
    private readonly billService: BillService,
  ) {}

  @Get('payment/callback')
  async callBackPayPal(@Req() req) {
    const orderId = req.query.token;
    const paymentId = await this.paypalPaymentService.capturePayPalPayment(orderId);
    const bills = await this.billService.getByPaymentId(paymentId);
    if (bills.length !== 0) {
      throw new BadRequestException('Invalid payment');
    }
    for (const bill of bills) {
      await this.billService.updateIsPaid(bill._id);
    }
    // res.redirect(`${HOST_URL}/payment/success`);
  }
}
