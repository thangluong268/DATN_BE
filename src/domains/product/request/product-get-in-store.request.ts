import { IsNotEmpty, IsString } from 'class-validator';
import { ProductsGetREQ } from './product-get.request';

export class ProductGetInStoreREQ extends ProductsGetREQ {
  @IsNotEmpty()
  @IsString()
  storeId: string;
}
