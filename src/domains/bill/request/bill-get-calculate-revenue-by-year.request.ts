import { IsNotEmpty } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export class BillGetCalculateRevenueByYearREQ {
  @IsNotEmpty()
  year: number;

  static toQueryCondition(year: number, storeId: string) {
    return [
      {
        $match: {
          storeId: storeId.toString(),
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

  static toQueryConditionForAllTime(storeId: string) {
    return [
      {
        $match: {
          status: BILL_STATUS.DELIVERED,
          storeId: storeId.toString(),
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPricePayment' },
        },
      },
    ];
  }
}
