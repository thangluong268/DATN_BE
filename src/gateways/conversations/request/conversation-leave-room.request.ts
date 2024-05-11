import { IsNotEmpty, IsString } from 'class-validator';

export class ConversationLeaveRoomREQ {
  @IsNotEmpty()
  @IsString()
  receiverId: string;
}
