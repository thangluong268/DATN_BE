import { IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';

export class FeedbackGetREQ extends PaginationREQ {
  @IsString()
  productId: string;
}
