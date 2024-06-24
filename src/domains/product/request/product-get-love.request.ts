import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class ProductsGetLoveREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toCondition(userId: string, query: ProductsGetLoveREQ) {
    return [
      { $match: { 'emojis.userId': userId.toString() } },
      { $addFields: { productObjId: { $toObjectId: '$productId' } } },
      { $lookup: { from: 'products', localField: 'productObjId', foreignField: '_id', as: 'product' } },
      { $addFields: { status: { $first: '$product.status' } } },
      { $addFields: { name: { $first: '$product.name' } } },
      { $addFields: { keywords: { $first: '$product.keywords' } } },
      { $match: { status: true } },
      {
        $match: {
          $or: query.search
            ? [
                { name: { $regex: query.search, $options: 'i' } },
                { keywords: { $regex: query.search, $options: 'i' } },
                { storeName: { $regex: query.search, $options: 'i' } },
              ]
            : [{}],
        },
      },
    ];
  }

  static toCount(userId: string, query: ProductsGetLoveREQ) {
    return [...ProductsGetLoveREQ.toCondition(userId, query), { $group: { _id: null, total: { $sum: 1 } } }];
  }

  static toFind(userId: string, query: ProductsGetLoveREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    return [
      [
        ...ProductsGetLoveREQ.toCondition(userId, query),
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { _id: 1, product: 1 } },
      ],
    ];
  }
}
