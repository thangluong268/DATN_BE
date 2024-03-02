import { IsNotEmpty } from 'class-validator';

export class ReceiverInfoDTO {
  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  address: string;
}
