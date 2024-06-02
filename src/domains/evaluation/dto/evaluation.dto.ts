import { IsNotEmpty } from 'class-validator';

export class EmojiDTO {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  name: string;
}
