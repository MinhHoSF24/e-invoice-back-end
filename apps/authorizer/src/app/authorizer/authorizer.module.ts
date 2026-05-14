import { Module } from '@nestjs/common';
import { AuthorizerController } from './controllers/authorizer.controller';
import { AuthorizerService } from './services/authorizer.service';
import { KeycloakModule } from '../keycloak/keycloak.module';

@Module({
  imports: [KeycloakModule],
  controllers: [AuthorizerController],
  providers: [AuthorizerService],
  exports: [],
})
export class AuthorizerModule {}
