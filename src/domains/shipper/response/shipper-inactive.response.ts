import { User } from 'domains/user/schema/user.schema';
import { GenderType } from 'shared/enums/common.enum';

export class ShipperRESP {
  id: string;
  avatar: string;
  name: string;
  emailShipper: string;
  email: string;
  phone: string;
  address: string;
  gender: GenderType;
  createdAt: Date;

  static of(shipper: User): ShipperRESP {
    return {
      id: shipper._id,
      avatar: shipper.avatar,
      name: shipper.fullName,
      emailShipper: shipper.emailShipper,
      email: shipper.email,
      phone: shipper.phone,
      address: shipper.addressShipper,
      gender: shipper.gender as GenderType,
      createdAt: shipper['createdAt'],
    };
  }
}
