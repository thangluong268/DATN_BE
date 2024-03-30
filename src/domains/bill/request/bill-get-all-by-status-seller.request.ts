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
      {
        $lookup: {
          from: 'users',
          let: { userObjId: { $toObjectId: '$userId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userObjId'] } } },
            { $project: { _id: 1, avatar: 1, fullName: 1, email: 1, address: 1, phone: 1 } },
          ],
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'products',
          let: { products: '$products' },
          pipeline: [
            {
              $addFields: {
                productObjIds: {
                  $map: {
                    input: '$$products',
                    as: 'product',
                    in: { $toObjectId: '$$product.id' },
                  },
                },
              },
            },
            { $match: { $expr: { $in: ['$_id', '$productObjIds'] } } },
            { $project: { name: 1, avatar: 1, oldPrice: 1, newPrice: 1 } },
          ],
          as: 'products',
        },
      },
      { $unwind: '$user' },
      { $addFields: { products: { $map: { input: '$products', as: 'p', in: { $mergeObjects: ['$$p'] } } } } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
  }
}
