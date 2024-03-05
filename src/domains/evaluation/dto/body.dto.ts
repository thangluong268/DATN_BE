import { IsNotEmpty, IsString } from 'class-validator';

export class EvaluationDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
