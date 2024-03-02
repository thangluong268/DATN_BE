import { IsNotEmpty } from 'class-validator';

export class ProductInfoDTO {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  type: string;
}
