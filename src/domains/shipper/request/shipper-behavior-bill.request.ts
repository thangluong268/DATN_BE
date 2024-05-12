import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SHIPPER_BEHAVIOR_BILL } from 'shared/enums/shipper.enum';

export class ShipperBehaviorBillREQ {
  @IsEnum(SHIPPER_BEHAVIOR_BILL)
  behavior: SHIPPER_BEHAVIOR_BILL;

  @IsOptional()
  @IsString()
  reason: string;
}
