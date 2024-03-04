import { IsNotEmpty } from 'class-validator';

export class EmojiDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  name: string;
}

export class HadEvaluation {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  isHad: boolean;
}
