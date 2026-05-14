import { Module } from '@nestjs/common';
import { KeycloakController } from './controller/keycloak.controller';
import { KeycloakHttpService } from './services/keycloak-http.service';

@Module({
  imports: [],
  controllers: [KeycloakController],
  providers: [KeycloakHttpService],
  exports: [KeycloakHttpService],
})
export class KeycloakModule {}
