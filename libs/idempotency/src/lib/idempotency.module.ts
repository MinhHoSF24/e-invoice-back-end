import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@keyv/redis';
import type { RedisClientType } from '@keyv/redis';
import { IDEMPOTENCY_REDIS_CLIENT } from './idempotency.constants';
import { IdempotencyRedisRepository } from './repositories/idempotency-redis.repository';
import { IdempotencyService } from './idempotency.service';

@Module({})
export class IdempotencyModule implements OnModuleDestroy {
  constructor(@Inject(IDEMPOTENCY_REDIS_CLIENT) private readonly redis?: RedisClientType) {}

  static forRoot(): DynamicModule {
    return {
      module: IdempotencyModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: IDEMPOTENCY_REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: async (configService: ConfigService): Promise<RedisClientType> => {
            const host = configService.get<string>('REDIS_CONFIG.HOST') || 'redis';
            const port = configService.get<number>('REDIS_CONFIG.PORT') || 6379;
            const client = createClient({ url: `redis://${host}:${port}` }) as RedisClientType;

            await client.connect();
            return client;
          },
        },
        IdempotencyRedisRepository,
        IdempotencyService,
      ],
      exports: [IdempotencyService],
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis?.isOpen) {
      await this.redis.quit();
    }
  }
}
