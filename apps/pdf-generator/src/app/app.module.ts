import { Module } from '@nestjs/common';
import { CONFIGURATION, TConfigurationType } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { PdfModule } from './modules/pdf/pdf.module';
import { InvoiceModule } from './modules/invoice/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION],
    }),
    PdfModule,
    InvoiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfigurationType = CONFIGURATION;
}
