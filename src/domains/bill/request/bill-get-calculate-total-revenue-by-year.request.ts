import { IsNotEmpty } from 'class-validator';

export class BillGetCalculateTotalByYearREQ {
  @IsNotEmpty()
  year: number;

  static toQueryCondition(year: number) {
    return [
      {
        $match: {
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

  static toQueryConditionForAllTime() {
    return [
      {
        $match: {
          status: 'DELIVERED',
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
