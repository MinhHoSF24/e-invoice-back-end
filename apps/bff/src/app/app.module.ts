import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CONFIGURATION, TConfigurationType } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';
import { AuthorizerModule } from './modules/authorizer/authorizer.module';
import { UserGuard } from '@common/guards/user.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RedisProvider } from '@common/configuration/redis.config';
import { ThrottlerProvider } from '@common/configuration/throttler.config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';
import { ClientsModule } from '@nestjs/microservices';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION],
    }),
    InvoiceModule,
    ProductModule,
    UserModule,
    AuthorizerModule,
    RedisProvider,
    ThrottlerProvider,
    WebhookModule,
    ClientsModule.registerAsync([GrpcProvider(GRPC_SERVICES.AUTHORIZER_SERVICE)]),
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ExceptionInterceptor },
    { provide: APP_GUARD, useClass: UserGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  static CONFIGURATION: TConfigurationType = CONFIGURATION;

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
