import { User } from 'domains/user/schema/user.schema';
import { GenderType } from 'shared/enums/common.enum';

export class ShipperInActiveRESP {
  id: string;
  avatar: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: GenderType;
  createdAt: Date;

  static of(shipper: User): ShipperInActiveRESP {
    return {
      id: shipper._id,
      avatar: shipper.avatar,
      name: shipper.fullName,
      email: shipper.emailShipper,
      phone: shipper.phone,
      address: shipper.addressShipper,
      gender: shipper.gender as GenderType,
      createdAt: shipper['createdAt'],
    };
  }
}
