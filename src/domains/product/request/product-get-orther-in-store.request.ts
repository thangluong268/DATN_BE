import { IsNotEmpty, IsString } from 'class-validator';

export class ProductGetOtherInStoreREQ {
  @IsNotEmpty()
  @IsString()
  storeId: string;

  @IsNotEmpty()
  @IsString()
  productId: string;
}
