import { IsNotEmpty, IsString } from 'class-validator';

export class EvaluationEmojiREQ {
  @IsString()
  @IsNotEmpty()
  name: string;
}
