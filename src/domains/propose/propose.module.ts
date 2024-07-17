import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorePropose, StoreProposeSchema } from 'domains/store-propose/schema/store-propose.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { NotificationModule } from 'gateways/notifications/notification.module';
import { PaymentModule } from 'payment/paymen.module';
import { RedisModule } from 'services/redis/redis.module';
import { ProposeController } from './propose.controller';
import { ProposeService } from './propose.service';
import { Propose, ProposeSchema } from './schema/propose.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Propose.name, schema: ProposeSchema },
      { name: Store.name, schema: StoreSchema },
      { name: StorePropose.name, schema: StoreProposeSchema },
    ]),
    forwardRef(() => PaymentModule),
    RedisModule,
    NotificationModule,
  ],
  controllers: [ProposeController],
  providers: [ProposeService],
  exports: [ProposeService, MongooseModule],
})
export class ProposeModule {}
