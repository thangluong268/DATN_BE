import { GenderType } from 'shared/enums/common.enum';
import { Shipper } from '../schema/shipper.schema';

export class ShipperInActiveRESP {
  id: string;
  avatar: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: GenderType;
  createdAt: Date;

  static of(shipper: Shipper): ShipperInActiveRESP {
    return {
      id: shipper._id,
      avatar: shipper.avatar,
      name: shipper.name,
      email: shipper.email,
      phone: shipper.phone,
      address: shipper.address,
      gender: shipper.gender,
      createdAt: shipper['createdAt'],
    };
  }
}
