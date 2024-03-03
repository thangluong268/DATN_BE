import { IsNotEmpty } from 'class-validator';
import { PRODUCT_TYPE } from 'shared/enums/bill.enum';

export class BillGetCountCharityByYearREQ {
  @IsNotEmpty()
  year: number;

  static toQueryCondition(storeId: string, year: number) {
    return [
      {
        $match: {
          storeId: storeId.toString(),
          status: 'DELIVERED',
          createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) },
        },
      },
      {
        $unwind: '$products',
      },
      {
        $match: {
          'products.type': `${PRODUCT_TYPE.GIVE.toUpperCase()}`,
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalCharity: { $sum: '$products.quantity' },
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
        $unwind: '$products',
      },
      {
        $match: {
          'products.type': `${PRODUCT_TYPE.GIVE.toUpperCase()}`,
        },
      },
      {
        $group: {
          _id: null,
          totalCharity: { $sum: '$products.quantity' },
        },
      },
    ];
  }
}
