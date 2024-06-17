import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class UsersHaveStoreREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toPipeline() {
    return [
      { $addFields: { idString: { $toString: '$_id' } } },
      {
        $lookup: {
          from: 'stores',
          localField: 'idString',
          foreignField: 'userId',
          as: 'store',
        },
      },
      { $addFields: { storeId: { $arrayElemAt: ['$store._id', 0] } } },
      { $addFields: { storeName: { $arrayElemAt: ['$store.name', 0] } } },
      { $addFields: { storeAvatar: { $arrayElemAt: ['$store.avatar', 0] } } },
      { $addFields: { joinDate: { $arrayElemAt: ['$store.createdAt', 0] } } },
      { $match: { store: { $ne: [] } } },
      { $project: { store: 0, socialProviders: 0, idString: 0 } },
    ];
  }

  static toCount() {
    return [...UsersHaveStoreREQ.toPipeline(), { $count: 'total' }];
  }

  static toFind(query: UsersHaveStoreREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const { search } = query;
    const pipeline = [...UsersHaveStoreREQ.toPipeline()] as any[];
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }
    pipeline.push({ $sort: { joinDate: -1 } }, { $limit: limit }, { $skip: skip });
    return pipeline;
  }
}
