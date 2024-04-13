import { IsEnum } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class BillGetAllByStatusUserREQ extends PaginationREQ {
  @IsEnum(BILL_STATUS)
  status: BILL_STATUS;

  static toCount(userId: string, query: BillGetAllByStatusUserREQ) {
    return { userId, status: query.status };
  }

  static toFind(userId: string, query: BillGetAllByStatusUserREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    return [
      { $match: { userId: userId.toString(), status: query.status } },
      { $addFields: { storeObjId: { $toObjectId: '$storeId' } } },
      { $lookup: { from: 'stores', localField: 'storeObjId', foreignField: '_id', as: 'store' } },
      { $addFields: { storeAvatar: { $first: '$store.avatar' } } },
      { $addFields: { storeName: { $first: '$store.name' } } },
      { $project: { storeObjId: 0, store: 0, paymentId: 0, isPaid: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
  }
}
