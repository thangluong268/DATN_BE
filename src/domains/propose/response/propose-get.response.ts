import { Propose } from '../schema/propose.schema';

export class ProposeGetRESP {
  id: string;
  image: string;
  title: string;
  price: number;
  timePackage: number;

  static of(propose: Propose): ProposeGetRESP {
    return {
      id: propose._id.toString(),
      image: propose.image,
      title: propose.title,
      price: propose.price,
      timePackage: propose.timePackage,
    };
  }
}
