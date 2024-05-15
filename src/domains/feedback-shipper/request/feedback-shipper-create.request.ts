import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class FeedbackShipperCreateREQ {
  @IsString()
  billId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  star: number;

  @IsOptional()
  @IsString()
  content: string;
}
