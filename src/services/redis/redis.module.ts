import { Module } from '@nestjs/common';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from 'app.config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'shared/constants/redis.constant';
import { RedisService } from './redis.service';

@Module({
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis({
          host: REDIS_HOST,
          port: REDIS_PORT ? parseInt(REDIS_PORT) : 6379,
          username: REDIS_USERNAME,
          password: REDIS_PASSWORD,
        });
      },
    },
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
