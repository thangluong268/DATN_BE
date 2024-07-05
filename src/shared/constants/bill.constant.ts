import { URL_FE } from 'app.config';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export const URL_FE_BILL_SUCCESS = `${URL_FE}/bill/user`;

export const BILL_STATUS_TRANSITION = {
  [BILL_STATUS.NEW]: 'Đơn mới',
  [BILL_STATUS.CONFIRMED]: 'Đang chuẩn bị',
  [BILL_STATUS.DELIVERING]: 'Đang giao',
  [BILL_STATUS.DELIVERED]: 'Đã giao',
  [BILL_STATUS.CANCELLED]: 'Đã hủy',
  [BILL_STATUS.REFUND]: 'Đã hoàn',
  [BILL_STATUS.BACK]: 'Đã trả',
};

export const BILL_STATUS_TRANSLATE_VALUE = {
  [BILL_STATUS.CANCELLED]: 'HỦY ĐƠN',
  [BILL_STATUS.REFUND]: 'HOÀN ĐƠN',
  [BILL_STATUS.BACK]: 'TRẢ HÀNG',
};

export const NUM_OF_REFUND_TO_BAN = 3;
export const NUM_OF_BACK_TO_BAN = 3;
export const NUM_OF_CANCEL_TO_BAN = 5;

export const NUM_OF_BAN_VALUE_BY_STATUS = {
  [BILL_STATUS.REFUND]: NUM_OF_REFUND_TO_BAN,
  [BILL_STATUS.BACK]: NUM_OF_BACK_TO_BAN,
  [BILL_STATUS.CANCELLED]: NUM_OF_CANCEL_TO_BAN,
};

export const NUM_OF_DAY_USER_NOT_ALLOW_DO_BEHAVIOR = 30;
export const NUM_OF_DAY_USER_NOT_ALLOW_USE_VOUCHER = 30;
export const NUM_OF_ALLOW_DELIVERING_BILL = 5;
