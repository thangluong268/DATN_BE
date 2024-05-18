import { IsOptional } from 'class-validator';

export class ProductGetMostInStoreREQ {
  @IsOptional()
  limit: number;

  static toQueryCondition(limit: number) {
    return [
      { $match: { status: true } },
      {
        $group: {
          _id: '$storeId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
    ];
  }
}
