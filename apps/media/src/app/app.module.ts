import { Module } from '@nestjs/common';
import { CONFIGURATION, TConfigurationType } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from './modules/media/media.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION],
    }),
    MediaModule,
    CloudinaryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfigurationType = CONFIGURATION;
}
