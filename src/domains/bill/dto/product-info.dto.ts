import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProductInfoDTO {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  avatar: string[];

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  oldPrice: number;

  @IsNotEmpty()
  @IsNumber()
  newPrice: number;
}
