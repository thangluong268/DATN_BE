import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class ProductGetRandomREQ {
  @IsOptional()
  limit: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  date?: Date;

  static toQueryCondition(query: ProductGetRandomREQ, excludeIds: Types.ObjectId[]) {
    const { limit, date } = query;
    let condition = {};
    if (date) condition = { createdAt: { $gt: new Date(date) } };
    return [
      {
        $match: {
          ...condition,
          _id: { $nin: excludeIds },
          status: true,
        },
      },
      { $sample: { size: limit ? Number(limit) : 10 } },
    ];
  }

  static toQueryConditionRemain(remainingLimit: number, excludeIds: Types.ObjectId[]) {
    return [
      {
        $match: {
          _id: { $nin: excludeIds },
          status: true,
        },
      },
      { $sample: { size: remainingLimit } },
    ];
  }
}
