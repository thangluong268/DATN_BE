import { Controller, Get, Req, Res } from '@nestjs/common';
import { PaypalPaymentService } from 'payment/paypal/paypal.service';

@Controller('paypal')
export class PayPalController {
  constructor(private readonly paypalPaymentService: PaypalPaymentService) {}

  @Get()
  async testPayPal(@Res() res) {
    const order = await this.paypalPaymentService.createOrder();
    console.log(order);

    res.redirect(order.url);

    return order;
  }

  @Get('payment/callback')
  async callBackPayPal(@Req() req) {
    const orderID = req.query.token;

    const order = await this.paypalPaymentService.captureOrder(orderID);

    return order;
  }
}
