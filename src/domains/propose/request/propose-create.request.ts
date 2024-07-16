import { IsNumber, IsString } from 'class-validator';

export class ProposeCreateREQ {
  @IsString()
  image: string;

  @IsString()
  title: string;

  @IsNumber()
  price: number;

  @IsNumber()
  timePackage: number;
}
