import { IsNotEmpty, IsString } from 'class-validator';

export class ConversationJoinRoomREQ {
  @IsNotEmpty()
  @IsString()
  receiverId: string;
}
