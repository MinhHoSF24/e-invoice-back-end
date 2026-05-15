import { Module } from '@nestjs/common';
import { AuthorizerController } from './controllers/authorizer.controller';
import { AuthorizerService } from './services/authorizer.service';
import { KeycloakModule } from '../keycloak/keycloak.module';
import { ClientsModule } from '@nestjs/microservices';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';

@Module({
  imports: [KeycloakModule, ClientsModule.registerAsync([TcpProvider(TCP_SERVICES.USER_ACCESS_SERVICE)])],
  controllers: [AuthorizerController],
  providers: [AuthorizerService],
  exports: [],
})
export class AuthorizerModule {}
