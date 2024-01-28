import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationREQ {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => value && parseInt(value))
  pageSize: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value && parseInt(value))
  @Min(1)
  pageNumber: number;
}
