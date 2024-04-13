import { IsOptional, IsString } from 'class-validator';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class GetStoresByAdminREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  static toQueryCondition(query: GetStoresByAdminREQ) {
    const search = query.search;
    const condition = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    return condition;
  }

  static toFind(query: GetStoresByAdminREQ) {
    const condition = GetStoresByAdminREQ.toQueryCondition(query);
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    return [
      { $match: condition },
      { $addFields: { userObjId: { $toObjectId: '$userId' } } },
      { $lookup: { from: 'users', localField: 'userObjId', foreignField: '_id', as: 'user' } },
      { $addFields: { userName: { $first: '$user.fullName' } } },
      { $sort: { createdAt: -1 } },
      { $project: { userObjId: 0, user: 0 } },
      { $limit: limit },
      { $skip: skip },
    ];
  }
}
