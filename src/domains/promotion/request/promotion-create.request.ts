import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PromotionCreateREQ {
  @IsNumber()
  @IsNotEmpty()
  minSpend: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @Type(() => String)
  @IsArray()
  productLimits?: string[];

  @IsOptional()
  orderLimit?: number;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startTime: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endTime: Date;
}
