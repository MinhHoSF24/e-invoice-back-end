import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { Logger } from '@nestjs/common';

export class MongoConfiguration {
  @IsNotEmpty()
  @IsString()
  URL: string;
  @IsNotEmpty()
  @IsString()
  DB_NAME: string;
  @IsOptional()
  @IsNumber()
  POOL_SIZE?: number;
  @IsOptional()
  @IsNumber()
  CONNECT_TIMEOUT_MS?: number;
  @IsOptional()
  @IsNumber()
  SOCKET_TIMEOUT_MS?: number;

  constructor(data?: Partial<MongoConfiguration>) {
    this.URL = data?.URL || process.env['MONGODB_URL'] || '';
    this.DB_NAME = data?.DB_NAME || process.env['MONGODB_DB_NAME'] || '';
    this.POOL_SIZE = data?.POOL_SIZE || Number(process.env['MONGODB_POOL_SIZE']) || 10;
    this.CONNECT_TIMEOUT_MS = data?.CONNECT_TIMEOUT_MS || Number(process.env['MONGODB_CONNECT_TIMEOUT_MS']) || 15000;
    this.SOCKET_TIMEOUT_MS = data?.SOCKET_TIMEOUT_MS || Number(process.env['MONGODB_SOCKET_TIMEOUT_MS']) || 30000;
  }
}

export const MongoProvider = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_CONFIG.URL'),
    dbName: configService.get<string>('MONGODB_CONFIG.DB_NAME'),
    // poolSize: configService.get<number>('MONGODB_CONFIG.POOL_SIZE'),
    connectTimeoutMS: configService.get<number>('MONGODB_CONFIG.CONNECT_TIMEOUT_MS'),
    socketTimeoutMS: configService.get<number>('MONGODB_CONFIG.SOCKET_TIMEOUT_MS'),
    onConnectionCreate: (connection: Connection) => {
      connection.on('connected', () => Logger.log(' 🟢   🟢   🟢   >>  connected'));
      connection.on('open', () => Logger.log(' 🟢   🟢   🟢   >>  open'));
      connection.on('disconnected', () => Logger.log(' 🪓   🪓   🪓   >>  disconnected'));
      connection.on('reconnected', () => Logger.log(' 🧡   🧡   🧡   >>  reconnected'));
      connection.on('disconnecting', () => Logger.log(' 🪓   🪓   🪓   >>  disconnecting'));

      return connection;
    },
  }),
});
