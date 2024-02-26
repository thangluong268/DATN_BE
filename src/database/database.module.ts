import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DATABASE_URL_DEV, NODE_ENV } from 'app.config';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: NODE_ENV === 'test' ? DATABASE_URL_DEV : DATABASE_URL_DEV,
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
