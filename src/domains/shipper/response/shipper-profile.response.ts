import { User } from 'domains/user/schema/user.schema';

export class ShipperProfileRESP {
  id: string;
  avatar: string;
  fullName: string;
  email: string;
  emailShipper: string;
  address: string;
  phone: string;
  gender: string;
  status: boolean;
  createdAt: string;

  static of(shipper: User): ShipperProfileRESP {
    return {
      id: shipper._id.toString(),
      avatar: shipper.avatar,
      fullName: shipper.fullName,
      email: shipper.email,
      emailShipper: shipper.emailShipper,
      address: shipper.addressShipper,
      phone: shipper.phone,
      gender: shipper.gender,
      status: shipper.status,
      createdAt: shipper['createdAt'],
    };
  }
}
