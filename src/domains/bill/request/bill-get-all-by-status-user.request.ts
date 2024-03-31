import { IsNotEmpty } from 'class-validator';
import { BILL_STATUS } from 'shared/enums/bill.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { QueryPagingHelper } from 'shared/helpers/pagination.helper';

export class BillGetAllByStatusUserREQ extends PaginationREQ {
  @IsNotEmpty()
  status: BILL_STATUS;

  static toPipeline(userId: string, query: BillGetAllByStatusUserREQ) {
    return [
      { $match: { userId: userId.toString() } },
      { $addFields: { updateDate: { $toDate: '$updatedAt' } } },
      {
        $lookup: {
          from: 'billsellers',
          localField: 'paymentId',
          foreignField: 'paymentId',
          as: 'billsellers',
        },
      },
      {
        $lookup: {
          from: 'stores',
          let: { storeIds: '$data.storeId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', { $map: { input: '$$storeIds', as: 'storeId', in: { $toObjectId: '$$storeId' } } }],
                },
              },
            },
          ],
          as: 'stores',
        },
      },
      { $unwind: '$stores' },
      {
        $addFields: {
          billsellers: {
            $map: {
              input: '$billsellers',
              as: 'bs',
              in: {
                storeId: '$$bs.storeId',
                status: '$$bs.status',
                storeName: '$stores.name',
                avatar: '$stores.avatar',
              },
            },
          },
        },
      },
      {
        $addFields: {
          data: {
            $map: {
              input: '$data',
              as: 'd',
              in: {
                $mergeObjects: [
                  '$$d',
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$billsellers',
                          as: 'bs',
                          cond: {
                            $and: [{ $eq: ['$$bs.storeId', '$$d.storeId'] }, { $eq: ['$$bs.paymentId', '$$d.paymentId'] }],
                          },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'promotions',
          let: { promotionId: '$promotionId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', { $toObjectId: '$$promotionId' }] } } },
            { $project: { avatar: 1, voucherCode: 1, minSpend: 1, value: 1, maxDiscountValue: 1 } },
          ],
          as: 'promotion',
        },
      },
      { $unwind: '$promotion' },
      { $unset: 'billsellers' },
      { $unset: 'stores' },
      { $project: { promotionId: 0, paymentId: 0 } },
      { $match: { data: { $elemMatch: { status: query.status } } } },
    ];
  }

  static toCount(userId: string, query: BillGetAllByStatusUserREQ) {
    return [...BillGetAllByStatusUserREQ.toPipeline(userId, query), { $unwind: '$data' }, { $count: 'total' }];
  }

  static toFind(userId: string, query: BillGetAllByStatusUserREQ) {
    const { skip, limit } = QueryPagingHelper.queryPaging(query);
    return [...BillGetAllByStatusUserREQ.toPipeline(userId, query), { $skip: skip }, { $limit: limit }];
  }
}
