import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class PromotionUpdateREQ {
  @IsOptional()
  @IsNumber()
  minSpend?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @Type(() => String)
  @IsArray()
  productLimits?: string[];

  @IsOptional()
  @IsNumber()
  orderLimit?: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startTime?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endTime?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
