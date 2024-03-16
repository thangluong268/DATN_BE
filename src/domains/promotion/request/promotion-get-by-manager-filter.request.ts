import { IsOptional } from 'class-validator';

export class PromotionGetByManagerFilterREQ {
  @IsOptional()
  min_minSpend: number;

  @IsOptional()
  max_minSpend: number;

  @IsOptional()
  min_quantity: number;

  @IsOptional()
  max_quantity: number;

  @IsOptional()
  min_value: number;

  @IsOptional()
  max_value: number;

  @IsOptional()
  min_startTime: Date;

  @IsOptional()
  max_startTime: Date;

  @IsOptional()
  min_endTime: Date;

  @IsOptional()
  max_endTime: Date;

  @IsOptional()
  isActive: boolean;

  static toFilter(filter: PromotionGetByManagerFilterREQ) {
    const condition = {
      minSpend: filter.min_minSpend && filter.max_minSpend ? { $gte: filter.min_minSpend, $lte: filter.max_minSpend } : undefined,
      quantity: filter.min_quantity && filter.max_quantity ? { $gte: filter.min_quantity, $lte: filter.max_quantity } : undefined,
      value: filter.min_value && filter.max_value ? { $gte: filter.min_value, $lte: filter.max_value } : undefined,
      startTime:
        filter.min_startTime && filter.max_startTime ? { $gte: filter.min_startTime, $lte: filter.max_startTime } : undefined,
      endTime: filter.min_endTime && filter.max_endTime ? { $gte: filter.min_endTime, $lte: filter.max_endTime } : undefined,
      isActive: filter.isActive !== undefined ? filter.isActive : undefined,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.fromEntries(Object.entries(condition).filter(([_, value]) => value !== undefined));
  }
}
