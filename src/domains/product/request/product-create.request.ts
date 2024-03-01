import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProductCreateREQ {
  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  avatar: string[];

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  oldPrice: number;

  @IsNotEmpty()
  @IsNumber()
  newPrice: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @Type(() => String)
  @IsArray()
  keywords: string[];
}
