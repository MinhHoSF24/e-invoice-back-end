import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfigurationType } from '../configuration';
import { MailModule } from './modules/mail/mail.module';
import { MailTemplateModule } from './modules/mail-template/mail-template.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }), MailModule, MailTemplateModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfigurationType = CONFIGURATION;
}
