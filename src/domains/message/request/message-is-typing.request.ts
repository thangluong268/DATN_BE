import { IsNotEmpty, IsString } from 'class-validator';

export class MessageIsTypingREQ {
  @IsNotEmpty()
  @IsString()
  receiverId: string;

  @IsNotEmpty()
  isTyping: boolean;
}
