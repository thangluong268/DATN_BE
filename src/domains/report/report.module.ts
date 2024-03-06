import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from 'domains/notification/notification.module';
import { ProductModule } from 'domains/product/product.module';
import { StoreModule } from 'domains/store/store.module';
import { UserModule } from 'domains/user/user.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportSchema } from './schema/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Report', schema: ReportSchema }]),
    NotificationModule,
    ProductModule,
    StoreModule,
    UserModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
