import { ConflictException } from '@nestjs/common';
import { HOST } from 'app.config';
import axios from 'axios';
import { PaymentDTO } from 'payment/dto/payment.dto';

export const createVNPayPayment = async (body: PaymentDTO) => {
  try {
    const res = await axios({
      url: `${HOST}/api/vn-pay`,
      method: 'post',
      data: {
        amount: body.amount,
        bankCode: 'NCB',
        paymentId: body.paymentId,
      },
    });
    return res.data;
  } catch (e) {
    throw new ConflictException((e && e.message) || 'Failed to check payment approval');
  }
};
