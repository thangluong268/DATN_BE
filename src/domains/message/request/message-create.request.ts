import { IsNotEmpty, IsString } from 'class-validator';

export class MessageCreateREQ {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsString()
  receiverId: string;
}
