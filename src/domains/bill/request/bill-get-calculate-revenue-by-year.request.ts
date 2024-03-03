import { IsNotEmpty } from 'class-validator';

export class BillGetCalculateRevenueByYearREQ {
  @IsNotEmpty()
  year: number;

  static toQueryCondition(year: number, storeId: string) {
    return [
      {
        $match: {
          storeId: storeId.toString(),
          status: 'DELIVERED',
          createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ];
  }

  static toQueryConditionForAllTime(storeId: string) {
    return [
      {
        $match: {
          status: 'DELIVERED',
          storeId: storeId.toString(),
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ];
  }
}
