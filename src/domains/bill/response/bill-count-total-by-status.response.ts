import { BILL_STATUS_TRANSITION } from 'shared/constants/bill.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export interface CountTotalByStatusInterface {
  status: BILL_STATUS;
  count: number;
}

export class CountTotalByStatusRESP {
  title: string;
  status: BILL_STATUS;
  count: number;

  static ofSeller(status: string, data: any): CountTotalByStatusRESP {
    return {
      title: BILL_STATUS_TRANSITION[status],
      status: status as BILL_STATUS,
      count: data.find((item) => item.status === status)?.count || 0,
    };
  }

  static ofUser(item: CountTotalByStatusInterface): CountTotalByStatusRESP {
    return {
      title: BILL_STATUS_TRANSITION[item.status],
      status: item.status,
      count: item.count || 0,
    };
  }
}
