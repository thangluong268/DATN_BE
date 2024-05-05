import { BILL_STATUS } from 'shared/enums/bill.enum';

export const BILL_STATUS_TRANSITION = {
  NEW: 'Đơn mới',
  CONFIRMED: 'Đang chuẩn bị',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã hoàn',
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
