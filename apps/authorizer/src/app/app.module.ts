import { Module } from '@nestjs/common';
import { CONFIGURATION, TConfigurationType } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { KeycloakModule } from './keycloak/keycloak.module';
import { AuthorizerModule } from './authorizer/authorizer.module';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION],
    }),
    KeycloakModule,
    AuthorizerModule,
  ],
  controllers: [],
  providers: [TcpProvider(TCP_SERVICES.AUTHORIZE_SERVICE)],
})
export class AppModule {
  static CONFIGURATION: TConfigurationType = CONFIGURATION;
}
