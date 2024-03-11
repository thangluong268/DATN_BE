import { ConflictException } from '@nestjs/common';
import { HOST_URL } from 'app.config';
import axios from 'axios';
import { BillVNPayREQ } from 'domains/bill/request/bill-vnpay.request';

export const createVNPayPayment = async (body: BillVNPayREQ) => {
  try {
    const res = await axios({
      url: `${HOST_URL}/api/vn-pay`,
      method: 'post',
      data: {
        amount: body.amount,
        bankCode: body.bankCode,
        orderId: body.billId,
      },
    });
    return res.data;
  } catch (e) {
    throw new ConflictException((e && e.message) || 'Failed to check payment approval');
  }
};

export const callBackVNPayPayment = async (body: BillVNPayREQ) => {
  try {
    const res = await axios({
      url: `${HOST_URL}/api/vn-pay`,
      method: 'post',
      data: {
        amount: body.amount,
        bankCode: body.bankCode,
        orderId: body.billId,
      },
    });
    return res.data;
  } catch (e) {
    throw new ConflictException((e && e.message) || 'Failed to check payment approval');
  }
};
