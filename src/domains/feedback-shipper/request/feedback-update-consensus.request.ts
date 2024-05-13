import { IsNotEmpty, IsString } from 'class-validator';

export class FeedbackUpdateConsensusREQ {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;
}
