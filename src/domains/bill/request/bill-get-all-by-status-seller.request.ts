import { IsNotEmpty } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class BillGetAllByStatusSellerREQ extends PaginationREQ {
  @IsNotEmpty()
  status: string;

  static toCount(storeId: string, query: BillGetAllByStatusSellerREQ) {
    return { storeId, status: query.status };
  }

  static toFind(storeId: string, query: BillGetAllByStatusSellerREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    return [
      { $match: { storeId, status: query.status } },
      { $addFields: { storeObjId: { $toObjectId: '$storeId' } } },
      { $lookup: { from: 'stores', localField: 'storeObjId', foreignField: '_id', as: 'store' } },
      { $addFields: { storeAvatar: { $first: '$store.avatar' } } },
      { $addFields: { storeName: { $first: '$store.name' } } },
      { $project: { storeObjId: 0, store: 0, paymentId: 0, isPaid: 0, shipperIds: 0 } },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
  }
}
