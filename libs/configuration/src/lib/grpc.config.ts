import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProvider, ClientsProviderAsyncOptions, GrpcOptions, Transport } from '@nestjs/microservices';
import { IsNotEmpty, IsObject } from 'class-validator';
import { join } from 'path';

export enum GRPC_SERVICES {
  AUTHORIZER_SERVICE = 'GRPC_AUTHORIZER_SERVICE',
  USER_ACCESS_SERVICE = 'GRPC_USER_ACCESS_SERVICE',
}

export class GrpcConfiguration {
  @IsNotEmpty()
  @IsObject()
  GRPC_AUTHORIZER_SERVICE: GrpcOptions & { name: string };

  @IsObject()
  @IsNotEmpty()
  GRPC_USER_ACCESS_SERVICE: GrpcOptions & { name: string };

  constructor() {
    this.GRPC_AUTHORIZER_SERVICE = GrpcConfiguration.setValue({
      key: GRPC_SERVICES.AUTHORIZER_SERVICE,
      protoPath: ['./proto/authorizer.proto'],
      host: process.env['AUTHORIZER_SERVICE_HOST'] || 'localhost',
      port: Number(process.env['AUTHORIZER_SERVICE_PORT']) || 5100,
    });
    this.GRPC_USER_ACCESS_SERVICE = GrpcConfiguration.setValue({
      key: GRPC_SERVICES.USER_ACCESS_SERVICE,
      protoPath: ['./proto/user-access.proto'],
      host: process.env['USER_ACCESS_SERVICE_HOST'] || 'localhost',
      port: Number(process.env['USER_ACCESS_SERVICE_PORT']) || 5101,
    });
  }

  private static setValue({
    key,
    protoPath,
    host = '127.0.0.1',
    port = 5100,
  }: {
    key: GRPC_SERVICES;
    protoPath: string | string[];
    host?: string;
    port?: number;
  }): GrpcOptions & { name: string } {
    return {
      name: key,
      transport: Transport.GRPC,
      options: {
        package: key,
        protoPath: Array.isArray(protoPath)
          ? protoPath.map((path) => join(__dirname, path))
          : [join(__dirname, protoPath)],
        url: `${host}:${port}`,
      },
    };
  }
}

export const GrpcProvider = (serviceName: GRPC_SERVICES): ClientsProviderAsyncOptions => {
  return {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      return configService.get(`GRPC_CONFIG.${serviceName}`) as GrpcOptions & { name: string };
    },
    name: serviceName,
  };
};
