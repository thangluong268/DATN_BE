import { BILL_STATUS_TRANSITION } from 'shared/constants/bill.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export class CountTotalByStatusUserRESP {
  title: string;
  status: BILL_STATUS;
  count: number;

  static of(status: string, data: any): CountTotalByStatusUserRESP {
    return {
      title: BILL_STATUS_TRANSITION[status],
      status: status as BILL_STATUS,
      count: data.find((item) => item.status === status)?.count || 0,
    };
  }
}
