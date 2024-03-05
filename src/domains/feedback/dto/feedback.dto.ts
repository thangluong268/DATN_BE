import { IsNotEmpty, IsString } from 'class-validator';

export class FeedbackDto {
  @IsNotEmpty()
  star: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  avatar: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  consensus: string[];

  @IsNotEmpty()
  isConsensus: boolean = false;
}
