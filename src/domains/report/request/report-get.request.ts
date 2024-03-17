import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PolicyType } from 'shared/enums/policy.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';
import { BooleanValidator } from 'shared/validators/boolean-query.validator';

export class ReportGetREQ extends PaginationREQ {
  @IsOptional()
  @IsString()
  search: string;

  @IsNotEmpty()
  @IsEnum(PolicyType)
  type: PolicyType;

  @IsNotEmpty()
  @BooleanValidator()
  status: boolean;

  static toQueryCondition(query: ReportGetREQ) {
    const { search, type, status } = query;
    const condition: any = { type, status };
    if (search) condition.$or = [{ content: { $regex: search, $options: 'i' } }];
    return condition;
  }

  static toFind(query: ReportGetREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    const subjectName = query.type === PolicyType.PRODUCT ? 'productName' : 'storeName';
    const collectionFrom = query.type === PolicyType.PRODUCT ? 'products' : 'stores';
    const pipeline = [
      { $match: ReportGetREQ.toQueryCondition(query) },
      { $addFields: { userObjId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $addFields: { subjectObjId: { $toObjectId: '$subjectId' } } },
      {
        $lookup: {
          from: collectionFrom,
          localField: 'subjectObjId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$user' },
      { $unwind: '$subject' },
      {
        $project: {
          _id: '$_id',
          userName: '$user.fullName',
          [subjectName]: '$subject.name',
          content: '$content',
          createdAt: '$createdAt',
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    return pipeline;
  }
}
