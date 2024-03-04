import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProductUpdateREQ {
  @IsOptional()
  @IsArray()
  @Type(() => String)
  avatar: string[];

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  oldPrice: number;

  @IsOptional()
  @IsNumber()
  newPrice: number;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  keywords: string[];
}
