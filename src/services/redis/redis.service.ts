import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'shared/constants/redis.constant';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  getClient(): Redis {
    return this.redisClient;
  }

  async setValue(key: string, value: string, expire?: number): Promise<void> {
    if (expire) {
      await this.redisClient.setex(key, expire, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async getValue(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }
}
