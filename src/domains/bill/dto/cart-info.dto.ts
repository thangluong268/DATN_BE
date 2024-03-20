import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProductInfoDTO } from './product-info.dto';
import { Type } from 'class-transformer';

export class CartInfoDTO {
  @IsNotEmpty()
  @IsString()
  storeId: string;

  @IsNotEmpty()
  @Type(() => ProductInfoDTO)
  @IsArray()
  products: ProductInfoDTO[];

  @IsOptional()
  @IsString()
  notes: string;

  @IsNotEmpty()
  @IsNumber()
  deliveryFee: number;

  @IsOptional()
  @IsString()
  promotionId: string;

  @IsNotEmpty()
  @IsNumber()
  totalPrice: number;
}
