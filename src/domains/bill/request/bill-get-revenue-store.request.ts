import { IsNotEmpty, IsString } from 'class-validator';

export class BillGetRevenueStoreREQ {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  static toQueryRevenueAllTime(storeId: string) {
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
