import { Controller } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finances')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}
}
