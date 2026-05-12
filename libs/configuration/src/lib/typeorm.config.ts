import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DatabaseType } from 'typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export class TypeOrmConfiguration {
  @IsString()
  @IsNotEmpty()
  HOST: string;
  @IsNumber()
  @IsNotEmpty()
  PORT: number;
  @IsString()
  @IsNotEmpty()
  USERNAME: string;
  @IsString()
  @IsNotEmpty()
  PASSWORD: string;
  @IsString()
  @IsNotEmpty()
  DB_NAME: string;
  @IsString()
  @IsNotEmpty()
  TYPE: DatabaseType;

  constructor(data?: Partial<TypeOrmConfiguration>) {
    this.HOST = data?.HOST || process.env['TYPEORM_HOST'] || 'localhost';
    this.PORT = data?.PORT || Number(process.env['TYPEORM_PORT']) || 5432;
    this.USERNAME = data?.USERNAME || process.env['TYPEORM_USERNAME'] || '';
    this.PASSWORD = data?.PASSWORD || process.env['TYPEORM_PASSWORD'] || '';
    this.DB_NAME = data?.DB_NAME || process.env['TYPEORM_DB_NAME'] || '';
    this.TYPE = (data?.TYPE as DatabaseType) || (process.env['TYPEORM_TYPE'] as DatabaseType) || 'postgres';
  }
}

export const TypeOrmProvider = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) =>
    ({
      type: config.get<DatabaseType>('TYPEORM_CONFIG.TYPE') as DatabaseType,
      host: config.get<string>('TYPEORM_CONFIG.HOST'),
      port: config.get<number>('TYPEORM_CONFIG.PORT'),
      username: config.get<string>('TYPEORM_CONFIG.USERNAME'),
      password: config.get<string>('TYPEORM_CONFIG.PASSWORD'),
      database: config.get<string>('TYPEORM_CONFIG.DB_NAME'),
      entity: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
    }) as TypeOrmModuleOptions,
});
