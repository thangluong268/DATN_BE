import { IsOptional } from 'class-validator';

export class BillGetTotalByStatusSellerREQ {
  @IsOptional()
  year: number;

  static toQueryCondition(storeId: string, status: string, year: number) {
    const query: any = { storeId, status };
    if (year) {
      query.$expr = { $eq: [{ $year: '$createdAt' }, { $year: new Date(year) }] };
    }
    return { ...query };
  }
}
