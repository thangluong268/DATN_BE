import { IsNotEmpty } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export class BillGetCalculateTotalByYearREQ {
  @IsNotEmpty()
  year: number;

  static toQueryCondition(year: number) {
    return [
      {
        $match: {
          status: BILL_STATUS.DELIVERED,
          createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalRevenue: { $sum: '$totalPricePayment' },
        },
      },
    ];
  }

  static toQueryConditionForAllTime() {
    return [
      { $match: { status: BILL_STATUS.DELIVERED } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPricePayment' } } },
    ];
  }
}
