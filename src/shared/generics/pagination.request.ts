import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationREQ {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  page: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  @Min(1)
  limit: number;
}
