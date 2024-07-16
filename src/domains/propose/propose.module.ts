import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreWallet, StoreWalletSchema } from 'domains/store-wallet/schema/store-wallet.schema';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { ProposeController } from './propose.controller';
import { ProposeService } from './propose.service';
import { Propose, ProposeSchema } from './schema/propose.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Propose.name, schema: ProposeSchema },
      { name: Store.name, schema: StoreSchema },
      { name: StoreWallet.name, schema: StoreWalletSchema },
    ]),
  ],
  controllers: [ProposeController],
  providers: [ProposeService],
  exports: [ProposeService, MongooseModule],
})
export class ProposeModule {}
