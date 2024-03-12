import { IsOptional } from 'class-validator';

export class StoreGetHaveMostProductREQ {
  @IsOptional()
  limit: number;

  static toQueryCondition(query: StoreGetHaveMostProductREQ) {
    const limit = query.limit ? Number(query.limit) : 10;
    return [{ $group: { _id: '$storeId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: limit }];
  }
}
