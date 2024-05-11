import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from 'domains/product/product.module';
import { Product, ProductSchema } from 'domains/product/schema/product.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { StoreModule } from 'domains/store/store.module';
import { User, UserSchema } from 'domains/user/schema/user.schema';
import { UserModule } from 'domains/user/user.module';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { MailModule } from 'services/mail/mail.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Report, ReportSchema } from './schema/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
    NotificationModule,
    ProductModule,
    StoreModule,
    UserModule,
    MailModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService, MongooseModule],
})
export class ReportModule {}
