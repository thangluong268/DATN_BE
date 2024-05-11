import { IsString } from 'class-validator';

export class ShipperActiveREQ {
  @IsString()
  email: string;
}
