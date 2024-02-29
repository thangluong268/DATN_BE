import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import {
  HOST_URL,
  VN_PAY_MERCHANT,
  VN_PAY_PAYMENT_URL,
  VN_PAY_SECRET,
} from 'app.config';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import * as querystring from 'qs';
import { getReturnUrlStatus, sortObject } from 'shared/helpers/vn-pay.helper';
import { v4 as uuid } from 'uuid';

@Controller('vn-pay')
export class VNPayController {
  constructor() {}

  @Post()
  addVNPay(@Req() req, @Res() res) {
    const createDate = dayjs(new Date()).format('YYYYMMDDHHmmss');

    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const orderId = uuid();
    const amount = req.body.amount;
    const bankCode = req.body.bankCode;

    const locale = 'vi';
    const currCode = 'VND';
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = VN_PAY_MERCHANT;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] =
      `${HOST_URL}/api/vn-pay/payment/vn-pay/callback`;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if (bankCode !== null && bankCode !== '') {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', VN_PAY_SECRET);
    const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    let vnpUrl = VN_PAY_PAYMENT_URL;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    console.log(vnpUrl);

    res.redirect(vnpUrl);
  }

  @Get('payment/vn-pay/callback')
  callBackVNPay(@Req() req, @Res() res) {
    let vnp_Params = req.query;

    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', VN_PAY_SECRET);
    const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

    console.log(secureHash);
    console.log(signed);

    if (secureHash === signed) {
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      console.log(vnp_Params);

      const code = vnp_Params['vnp_ResponseCode'];

      const message = getReturnUrlStatus(code);

      console.log(message);
      res.set({
        'Content-Type': 'application/json',
        'Cache-Control':
          'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
      });
      res.send({ success: message });
    } else {
      res.send({ error: 'Invalid signature' });
    }
  }
}
