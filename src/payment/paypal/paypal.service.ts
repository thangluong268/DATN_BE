import { HOST_URL, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from 'app.config';
import axios, { Axios, AxiosHeaders } from 'axios';
import * as CC from 'currency-converter-lt';
import { PaymentDTO } from 'payment/dto/payment.dto';
import { PaymentOrderRto } from './paypal.route';

export class PaypalPaymentService {
  private readonly axios: Axios;
  private readonly basicAuth: string;

  constructor() {
    const auth = [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET].join(':');
    this.basicAuth = Buffer.from(auth).toString('base64');
    this.axios = axios.create();
  }

  private async getAccessToken(): Promise<string> {
    const url = 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    headers.set('Authorization', `Basic ${this.basicAuth}`);
    const { data } = await this.axios.post(url, new URLSearchParams({ grant_type: 'client_credentials' }), { headers });
    return data.access_token;
  }

  public async createPayPalPayment(bill: PaymentDTO) {
    const url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders';
    const accessToken = await this.getAccessToken();
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Paypal-Request-Id', bill.paymentId);

    const currencyConverter = new CC();
    const amountUSD = await currencyConverter.from('VND').to('USD').amount(bill.amount).convert();

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: bill.paymentId,
          amount: {
            currency_code: 'USD',
            value: amountUSD,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            // payment_method_selected: 'PAYPAL',
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'TEST INC',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: `${HOST_URL}/api/paypal/payment/callback`,
            cancel_url: `${HOST_URL}/cancelUrl`,
          },
        },
      },
    };

    const { data } = await this.axios.post(url, body, { headers });
    const { urlCheckout } = new PaymentOrderRto(data);
    console.log(urlCheckout);
    return urlCheckout;
  }

  public async capturePayPalPayment(orderId: string) {
    const url = `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;
    const accessToken = await this.getAccessToken();
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${accessToken}`);
    // headers.set('Paypal-Request-Id', paypalRequestID);
    const { data } = await this.axios.post(url, {}, { headers });
    return data;
  }
}
