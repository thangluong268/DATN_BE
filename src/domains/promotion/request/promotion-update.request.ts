import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class PromotionUpdateREQ {
  @IsOptional()
  @IsString()
  avatar: string;

  @IsOptional()
  @IsNumber()
  minSpend: number;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  storeIds: string[];

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startTime: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endTime: Date;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
