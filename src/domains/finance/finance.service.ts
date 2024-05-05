import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getMonthRevenue } from 'domains/bill/helper/get-month-revenue.helper';
import { Model } from 'mongoose';
import { BaseResponse } from 'shared/generics/base.response';
import { Finance } from './schema/finance.schema';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  constructor(
    @InjectModel(Finance.name)
    private readonly financeModel: Model<Finance>,
  ) {}

  async getFinances(year: number) {
    this.logger.log('Get finances');
    const data = await this.financeModel.aggregate([
      {
        $match: { createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          expense: { $sum: '$expense' },
          revenue: { $sum: '$revenue' },
        },
      },
    ]);
    const monthlyExpense = getMonthRevenue();
    const monthlyRevenue = getMonthRevenue();
    data.forEach((entry: { _id: number; expense: number; revenue: number }) => {
      const month = entry._id;
      monthlyExpense[`Tháng ${month}`] = entry.expense;
      monthlyRevenue[`Tháng ${month}`] = entry.revenue;
    });
    return BaseResponse.withMessage({ monthlyExpense, monthlyRevenue }, 'Lấy dữ liệu thành công');
  }
}
