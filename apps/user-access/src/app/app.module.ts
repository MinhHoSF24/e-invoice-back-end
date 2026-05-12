import { Module } from '@nestjs/common';
import { CONFIGURATION, TConfigurationType } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { RoleModule } from './modules/role.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION],
    }),
    RoleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfigurationType = CONFIGURATION;
}
