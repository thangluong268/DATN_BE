import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FeedbackCreateREQ {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsNotEmpty()
  star: number;
}
