import { Module } from '@nestjs/common';
import { Client, ClientsModule } from '@nestjs/microservices';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';
import { AuthorizerController } from './controllers/authorizer.controller';

@Module({
  imports: [ClientsModule.registerAsync([TcpProvider(TCP_SERVICES.AUTHORIZE_SERVICE)])],
  controllers: [AuthorizerController],
  providers: [],
  exports: [ClientsModule],
})
export class AuthorizerModule {}
