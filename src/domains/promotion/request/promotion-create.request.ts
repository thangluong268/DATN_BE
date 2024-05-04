import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { DateValidator } from 'shared/validators/date.validator';

export class PromotionCreateREQ {
  @IsNotEmpty()
  @IsString()
  avatar: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  minSpend: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  value: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  maxDiscountValue: number;

  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  storeIds: string[];

  @DateValidator()
  startTime: Date;

  @DateValidator()
  endTime: Date;
}
