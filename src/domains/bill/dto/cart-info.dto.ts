import { IsNotEmpty, IsOptional } from 'class-validator';
import { ProductInfoDTO } from './product-info.dto';

export class CartInfoDTO {
  @IsNotEmpty()
  storeId: string;

  @IsNotEmpty()
  products: ProductInfoDTO[];

  @IsOptional()
  notes: string;

  @IsNotEmpty()
  totalPrice: number;
}
