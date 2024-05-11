import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class ConversationGetREQ extends PaginationREQ {
  @IsNotEmpty()
  @IsString()
  receiverId: string;
}
