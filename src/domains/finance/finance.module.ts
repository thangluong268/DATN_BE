import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Finance, FinanceSchema } from './schema/finance.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Finance.name, schema: FinanceSchema }])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [MongooseModule],
})
export class FinanceModule {}
