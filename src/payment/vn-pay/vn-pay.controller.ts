import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import {
  HOST_URL,
  URL_FE,
  VN_PAY_COMMAND,
  VN_PAY_CURRENCY_VND,
  VN_PAY_LOCALE_VN,
  VN_PAY_MERCHANT,
  VN_PAY_PAYMENT_URL,
  VN_PAY_SECRET,
  VN_PAY_VERSION,
} from 'app.config';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { BillService } from 'domains/bill/bill.service';
import * as querystring from 'qs';
import { sortObject } from 'shared/helpers/vn-pay.helper';

@Controller('vn-pay')
export class VNPayController {
  constructor(private readonly billService: BillService) {}

  @Post()
  // @Redirect('https://sandbox.vnpayment.vn', 302)
  addVNPay(@Req() req) {
    const createDate = dayjs(new Date()).format('YYYYMMDDHHmmss');

    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const orderId = req.body.paymentId;
    const amount = req.body.amount;
    const bankCode = req.body.bankCode;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = VN_PAY_VERSION;
    vnp_Params['vnp_Command'] = VN_PAY_COMMAND;
    vnp_Params['vnp_TmnCode'] = VN_PAY_MERCHANT;
    vnp_Params['vnp_Locale'] = VN_PAY_LOCALE_VN;
    vnp_Params['vnp_CurrCode'] = VN_PAY_CURRENCY_VND;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD: ' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = `${HOST_URL}/api/vn-pay/payment/vn-pay/callback`;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if (bankCode !== null && bankCode !== '') {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', VN_PAY_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    let vnpUrl = VN_PAY_PAYMENT_URL;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
    return vnpUrl;
  }

  @Get('payment/vn-pay/callback')
  async callBackVNPay(@Req() req, @Res() res) {
    let vnp_Params = req.query;

    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', VN_PAY_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    const paymentId = vnp_Params['vnp_TxnRef'];
    if (secureHash === signed) {
      const code = vnp_Params['vnp_ResponseCode'];
      if (code !== '00') {
        await this.billService.handleBillFail(paymentId);
        res.redirect(`${URL_FE}/error`);
      } else {
        await this.billService.handleBillSuccess(paymentId);
        res.redirect(`${URL_FE}/user/invoice`);
      }
    } else {
      await this.billService.handleBillFail(paymentId);
      res.redirect(`${URL_FE}/error`);
    }
  }
}
