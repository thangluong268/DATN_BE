import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { leanObject } from 'shared/parsers/io.parser';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';

export class PromotionGetByManagerFilterREQ {
  @IsOptional()
  @IsString()
  storeId: string;

  @IsOptional()
  @IsNumber()
  min_minSpend: number;

  @IsOptional()
  @IsNumber()
  max_minSpend: number;

  @IsOptional()
  @IsNumber()
  min_quantity: number;

  @IsOptional()
  @IsNumber()
  max_quantity: number;

  @IsOptional()
  @IsNumber()
  min_value: number;

  @IsOptional()
  @IsNumber()
  max_value: number;

  @IsOptional()
  @IsNumber()
  min_maxDiscountValue: number;

  @IsOptional()
  @IsNumber()
  max_maxDiscountValue: number;

  @IsOptional()
  @IsDate()
  min_startTime: Date;

  @IsOptional()
  @IsDate()
  max_startTime: Date;

  @IsOptional()
  @IsDate()
  min_endTime: Date;

  @IsOptional()
  @IsDate()
  max_endTime: Date;

  @IsOptional()
  @BooleanValidator()
  isActive: boolean;

  static toFilter(filter: PromotionGetByManagerFilterREQ) {
    const condition = {
      storeIds: filter.storeId ? filter.storeId : undefined,
      minSpend: filter.min_minSpend && filter.max_minSpend ? { $gte: filter.min_minSpend, $lte: filter.max_minSpend } : undefined,
      quantity: filter.min_quantity && filter.max_quantity ? { $gte: filter.min_quantity, $lte: filter.max_quantity } : undefined,
      value: filter.min_value && filter.max_value ? { $gte: filter.min_value, $lte: filter.max_value } : undefined,
      maxDiscountValue:
        filter.min_maxDiscountValue && filter.max_maxDiscountValue
          ? { $gte: filter.min_maxDiscountValue, $lte: filter.max_maxDiscountValue }
          : undefined,
      startTime:
        filter.min_startTime && filter.max_startTime ? { $gte: filter.min_startTime, $lte: filter.max_startTime } : undefined,
      endTime: filter.min_endTime && filter.max_endTime ? { $gte: filter.min_endTime, $lte: filter.max_endTime } : undefined,
      isActive: filter.isActive !== undefined ? filter.isActive : undefined,
    };
    return leanObject(condition);
  }
}
