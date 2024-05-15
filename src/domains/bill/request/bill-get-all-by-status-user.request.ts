import { IsEnum } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class BillGetAllByStatusUserREQ extends PaginationREQ {
  @IsEnum(BILL_STATUS)
  status: BILL_STATUS;

  static toCondition(userId: string, query: BillGetAllByStatusUserREQ) {
    const { status } = query;
    if (status === BILL_STATUS.DELIVERED) return { userId, status: { $ne: BILL_STATUS.REFUND }, isShipperConfirmed: true };
    const condition = { userId, status } as any;
    if (status === BILL_STATUS.DELIVERING) condition.isShipperConfirmed = false;
    return condition;
  }

  static toFind(userId: string, query: BillGetAllByStatusUserREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    return [
      { $match: BillGetAllByStatusUserREQ.toCondition(userId, query) },
      { $addFields: { storeObjId: { $toObjectId: '$storeId' } } },
      { $lookup: { from: 'stores', localField: 'storeObjId', foreignField: '_id', as: 'store' } },
      { $addFields: { storeAvatar: { $first: '$store.avatar' } } },
      { $addFields: { storeName: { $first: '$store.name' } } },
      { $project: { storeObjId: 0, store: 0, paymentId: 0, isPaid: 0, shipperIds: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
  }
}
