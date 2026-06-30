import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, TcpClientOptions, Transport } from '@nestjs/microservices';
import { IsNotEmpty, IsObject } from 'class-validator';
import { createTracingClientProxy } from '@common/utils/tracing.util';
import { createResilientClientProxy, ResilienceService } from '@common/resilience';

export enum TCP_SERVICES {
  INVOICE_SERVICE = 'TCP_INVOICE_SERVICE',
  PRODUCT_SERVICE = 'TCP_PRODUCT_SERVICE',
  USER_ACCESS_SERVICE = 'TCP_USER_ACCESS_SERVICE',
  AUTHORIZE_SERVICE = 'TCP_AUTHORIZE_SERVICE',
  PDF_GENERATOR_SERVICE = 'TCP_PDF_GENERATOR_SERVICE',
  MEDIA_SERVICE = 'TCP_MEDIA_SERVICE',
}

export class TcpConfiguration {
  @IsObject()
  @IsNotEmpty()
  TCP_INVOICE_SERVICE: TcpClientOptions;

  @IsObject()
  @IsNotEmpty()
  TCP_PRODUCT_SERVICE: TcpClientOptions;

  @IsObject()
  @IsNotEmpty()
  TCP_USER_ACCESS_SERVICE: TcpClientOptions;

  @IsObject()
  @IsNotEmpty()
  TCP_AUTHORIZE_SERVICE: TcpClientOptions;

  @IsObject()
  @IsNotEmpty()
  TCP_PDF_GENERATOR_SERVICE: TcpClientOptions;

  @IsNotEmpty()
  @IsObject()
  TCP_MEDIA_SERVICE: TcpClientOptions;

  constructor() {
    Object.entries(TCP_SERVICES).forEach(([key, serviceName]) => {
      const host = process.env[`${key}_HOST`] || 'localhost';
      const port = Number(process.env[`${serviceName}_PORT`]);

      this[serviceName] = TcpConfiguration.setValue(host, port);
    });
  }

  public static setValue(host: string, port: number): TcpClientOptions {
    return {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    };
  }
}

export interface TcpProviderOptions {
  resilient?: boolean;
  traced?: boolean;
}

export const TcpProvider = (serviceName: keyof TcpConfiguration, options: TcpProviderOptions = {}): Provider => {
  const { resilient = false, traced = true } = options;

  return {
    provide: serviceName,
    inject: [ConfigService, { token: ResilienceService, optional: true }],
    useFactory: (configService: ConfigService, resilienceService?: ResilienceService) => {
      const option = configService.get(`TCP_CONFIG.${serviceName}`) as TcpClientOptions;
      let client = ClientProxyFactory.create(option);

      if (traced) {
        client = createTracingClientProxy(client);
      }

      if (resilient) {
        if (!resilienceService) {
          throw new Error(`ResilienceModule.forRoot() must be imported before enabling resilience for ${serviceName}`);
        }

        client = createResilientClientProxy(client, resilienceService.getPolicy(serviceName));
      }

      return client;
    },
  };
};
