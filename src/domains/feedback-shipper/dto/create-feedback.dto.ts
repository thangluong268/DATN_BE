import { IsNotEmpty } from 'class-validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  star: number;
}
