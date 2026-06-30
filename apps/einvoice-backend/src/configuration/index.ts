import { BaseConfiguration } from '@common/configuration/base.config';
import { AppConfiguration } from '@common/configuration/app.config';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TcpConfiguration } from '@common/configuration/tcp.config';
import { MongoConfiguration } from '@common/configuration/mongo.config';
import { StripeConfiguration } from '@common/configuration/stripe.config';
import { LokiConfiguration } from '@common/configuration/loki.config';
import { RedisConfiguration } from '@common/configuration/redis.config';

export class Configuration extends BaseConfiguration {
  @ValidateNested()
  @Type(() => AppConfiguration)
  APP_CONFIG = new AppConfiguration();

  @ValidateNested()
  @Type(() => TcpConfiguration)
  TCP_CONFIG = new TcpConfiguration();

  @ValidateNested()
  @Type(() => MongoConfiguration)
  MONGODB_CONFIG = new MongoConfiguration();

  @ValidateNested()
  @Type(() => StripeConfiguration)
  STRIPE_CONFIG = new StripeConfiguration();

  @ValidateNested()
  @Type(() => LokiConfiguration)
  LOKI_CONFIG = new LokiConfiguration();

  @ValidateNested()
  @Type(() => RedisConfiguration)
  REDIS_CONFIG = new RedisConfiguration();
}

export const CONFIGURATION = new Configuration();
export type TConfigurationType = typeof CONFIGURATION;

CONFIGURATION.validate();
