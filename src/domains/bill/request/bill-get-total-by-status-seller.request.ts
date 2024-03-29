import { IsOptional } from 'class-validator';

export class BillGetTotalByStatusSellerREQ {
  @IsOptional()
  year: number;

  static toQueryCondition(storeId: string, year: number) {
    return [
      {
        $match: {
          storeId,
          ...(year ? { createdAt: { $expr: { $eq: [{ $year: '$createdAt' }, { $year: new Date(year) }] } } } : {}),
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ];
  }
}
