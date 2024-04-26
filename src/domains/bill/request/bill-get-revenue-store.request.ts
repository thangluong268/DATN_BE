import { IsNotEmpty, IsString } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export class BillGetRevenueStoreREQ {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  static toQueryRevenueAllTime(storeId: string) {
    return [
      {
        $match: {
          status: BILL_STATUS.DELIVERED,
          isSuccess: true,
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
