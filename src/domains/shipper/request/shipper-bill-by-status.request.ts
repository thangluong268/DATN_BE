import { IsEnum, IsOptional } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';

export class BillByStatusShipperGetREQ extends PaginationREQ {
  @IsEnum(BILL_STATUS)
  status: BILL_STATUS;

  @IsOptional()
  @BooleanValidator()
  isShipperConfirmed: boolean;

  static toCondition(userId: string, query: BillByStatusShipperGetREQ) {
    const { status, isShipperConfirmed } = query;
    const condition = { shipperIds: userId, status } as any;
    if (status === BILL_STATUS.CONFIRMED) {
      condition.isFindShipper = true;
    } else if (status === BILL_STATUS.DELIVERING) {
      condition.isShipperConfirmed = isShipperConfirmed || false;
    }
    return condition;
  }

  static toFind(userId: string, query: BillByStatusShipperGetREQ) {
    const { status } = query;
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const pipeline = [
      { $match: BillByStatusShipperGetREQ.toCondition(userId, query)},
      { $addFields: { storeObjId: { $toObjectId: '$storeId' } } },
      { $lookup: { from: 'stores', localField: 'storeObjId', foreignField: '_id', as: 'store' } },
      { $addFields: { storeAvatar: { $first: '$store.avatar' } } },
      { $addFields: { storeName: { $first: '$store.name' } } },
      { $addFields: { storeAddress: { $first: '$store.address' } } },
      { $addFields: { storePhone: { $first: '$store.phoneNumber' } } },
      { $project: { storeObjId: 0, store: 0, paymentId: 0, isPaid: 0, shipperIds: 0 } },
      { $sort: { createdAt: -1 } },
    ] as any[];
    if (status !== BILL_STATUS.CONFIRMED) {
      pipeline.push({ $skip: skip }, { $limit: limit });
    }
    return pipeline;
  }
}
