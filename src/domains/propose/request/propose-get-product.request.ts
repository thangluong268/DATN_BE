import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class ProposeGetProductREQ {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseInt(value) : 10))
  @Min(10)
  limit: number;
}
