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
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: '$_id',
          userName: '$user.fullName',
          [subjectName]: '$subject.name',
          content: '$content',
          createdAt: '$createdAt',
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];
    return pipeline;
  }

  static toExport(type: PolicyType) {
    const collectionFrom = type === PolicyType.PRODUCT ? 'products' : type === PolicyType.STORE ? 'stores' : 'users';
    const pipeline = [
      { $match: { status: true } },
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
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: '$_id',
          subjectId: '$subjectId',
          subjectName: '$subject.name',
          userId: '$userId',
          userName: '$user.fullName',
          content: '$content',
          type: '$type',
          status: '$status',
          createdAt: '$createdAt',
        },
      },
    ];
    return pipeline;
  }
}
