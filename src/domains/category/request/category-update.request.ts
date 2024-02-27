import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CategoryUpdateREQ {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  status: string;
}
