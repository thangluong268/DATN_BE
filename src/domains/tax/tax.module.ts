import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tax, TaxSchema } from './schema/tax.schema';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tax.name, schema: TaxSchema }])],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService, MongooseModule],
})
export class TaxModule {}
