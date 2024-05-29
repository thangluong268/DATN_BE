import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProductInfoDTO {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  type: string;

  @IsString()
  avatar: string;

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
