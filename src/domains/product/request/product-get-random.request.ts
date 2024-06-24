import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';

export class ProductGetRandomREQ {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  @Min(10)
  limit: number;

  static toFind(query: ProductGetRandomREQ) {
    const limit = query.limit || 10;
    return [
      { $match: { status: true } },
      { $addFields: { productId: { $toString: '$_id' } } },
      { $lookup: { from: 'evaluations', localField: 'productId', foreignField: 'productId', as: 'evaluation' } },
      { $addFields: { countEmoji: { $size: { $first: '$evaluation.emojis' } } } },
      { $lookup: { from: 'bills', localField: 'productId', foreignField: 'products.id', as: 'bills' } },
      {
        $addFields: {
          countDelivered: {
            $size: {
              $filter: {
                input: '$bills',
                as: 'bill',
                cond: {
                  $and: [{ $eq: ['$$bill.status', BILL_STATUS.DELIVERED] }, { $in: ['$productId', '$$bill.products.id'] }],
                },
              },
            },
          },
        },
      },
      { $sort: { countEmoji: -1, countDelivered: -1 } },
      { $limit: limit },
      { $project: { productId: 0, countEmoji: 0, countDelivered: 0, evaluation: 0, bills: 0 } },
    ];
  }
}
