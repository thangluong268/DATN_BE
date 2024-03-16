import { IsOptional } from 'class-validator';
import { ObjectId } from 'mongodb';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class PromotionGetUserUsesREQ extends PaginationREQ {
  @IsOptional()
  search: string;

  static toTotalQuery(promotionId: ObjectId) {
    return [
      { $match: { _id: promotionId } },
      { $unwind: '$userUses' },
      { $addFields: { userIdString: { $toObjectId: '$userUses' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdString',
          foreignField: '_id',
          as: 'userInfos',
        },
      },
      { $unwind: '$userInfos' },
      { $group: { _id: null, total: { $sum: 1 } } },
    ];
  }

  static toFindUsers(promotionId: ObjectId, query: PromotionGetUserUsesREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const pipeline = [
      { $match: { _id: promotionId } },
      { $unwind: '$userUses' },
      { $addFields: { userIdString: { $toObjectId: '$userUses' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdString',
          foreignField: '_id',
          as: 'userInfos',
        },
      },
      { $unwind: '$userInfos' },
    ] as any[];
    if (query.search) {
      pipeline.push({
        $match: {
          $or: [
            { 'userInfos.fullName': { $regex: query.search, $options: 'i' } },
            { 'userInfos.email': { $regex: query.search, $options: 'i' } },
            { 'userInfos.phone': { $regex: query.search, $options: 'i' } },
            { 'userInfos.gender': { $regex: query.search, $options: 'i' } },
          ],
        },
      });
    }
    pipeline.push(
      {
        $project: {
          _id: 0,
          id: '$userInfos._id',
          avatar: '$userInfos.avatar',
          fullName: '$userInfos.fullName',
          email: '$userInfos.email',
          phone: '$userInfos.phone',
          gender: '$userInfos.gender',
        },
      },
      { $skip: skip },
      { $limit: limit },
    );
    return pipeline;
  }
}
