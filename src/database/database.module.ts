import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DATABASE_URL, NODE_ENV } from 'app.config';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: NODE_ENV === 'development' ? DATABASE_URL : DATABASE_URL,
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
