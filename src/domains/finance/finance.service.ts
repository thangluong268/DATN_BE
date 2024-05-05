import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finance } from './schema/finance.schema';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  constructor(
    @InjectModel(Finance.name)
    private readonly financeModel: Model<Finance>,
  ) {}
}
