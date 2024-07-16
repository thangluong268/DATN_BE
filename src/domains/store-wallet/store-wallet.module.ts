import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from 'domains/store/schema/store.schema';
import { StoreWallet, StoreWalletSchema } from './schema/store-wallet.schema';
import { StoreWalletController } from './store-wallet.controller';
import { StoreWalletService } from './store-wallet.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: StoreWallet.name, schema: StoreWalletSchema },
    ]),
  ],
  controllers: [StoreWalletController],
  providers: [StoreWalletService],
  exports: [StoreWalletService, MongooseModule],
})
export class StoreWalletModule {}
