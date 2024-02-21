import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class StoreUpdateREQ {
  @IsOptional()
  @IsString()
  avatar: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @Type(() => String)
  @IsArray()
  phoneNumber: string[];
}
