import { IsNotEmpty, IsOptional } from 'class-validator';

export class GiveInfoDTO {
  @IsNotEmpty()
  senderName: string;

  @IsOptional()
  wish: string;
}
