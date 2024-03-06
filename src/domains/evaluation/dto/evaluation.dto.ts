import { IsNotEmpty } from 'class-validator';

export class EmojiDTO {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  name: string;
}

export class HadEvaluationDTO {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  isHad: boolean;
}
