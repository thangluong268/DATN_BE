import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PromotionCreateREQ {
  @IsNotEmpty()
  @IsString()
  avatar: string;

  @IsNumber()
  @IsNotEmpty()
  minSpend: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  storeIds: string[];

  @IsDate()
  @Transform(({ value }) => new Date(value))
  startTime: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  endTime: Date;
}
