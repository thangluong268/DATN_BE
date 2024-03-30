import { BILL_STATUS_TRANSITION } from 'shared/constants/bill.constant';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export class CountTotalByStatusUserRESP {
  title: string;
  status: BILL_STATUS;
  count: number;

  static of(data: any): CountTotalByStatusUserRESP {
    return {
      title: BILL_STATUS_TRANSITION[data.status],
      status: data.status,
      count: data.count,
    };
  }
}
