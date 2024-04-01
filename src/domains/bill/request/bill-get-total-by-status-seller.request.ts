import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class BillGetTotalByStatusSellerREQ {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  year: number;

  static toQueryCondition(storeId: string, year: number) {
    return [
      {
        $match: {
          $and: [
            { storeId: storeId.toString() },
            ...(year
              ? [
                  {
                    createdAt: {
                      $gte: new Date(`${year}-01-01`),
                      $lt: new Date(`${year + 1}-01-01`),
                    },
                  },
                ]
              : []),
          ],
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ];
  }
}
