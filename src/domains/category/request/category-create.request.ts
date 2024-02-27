import { IsNotEmpty, IsString } from 'class-validator';

export class CategoryCreateREQ {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}
