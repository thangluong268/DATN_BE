import { IsNumber, IsOptional } from 'class-validator';

export class ProductGetMostInStoreREQ {
  @IsOptional()
  @IsNumber()
  limit: number;

  static toQueryCondition(limit: number) {
    return [
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
