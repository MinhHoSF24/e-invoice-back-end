import { DynamicModule, Global, Module } from '@nestjs/common';
import { RESILIENCE_OPTIONS } from './resilience.constants';
import { DEFAULT_RESILIENCE_OPTIONS, ResilienceOptionsMap } from './resilience.config';
import { ResilienceService } from './resilience.service';

@Global()
@Module({
  providers: [{ provide: RESILIENCE_OPTIONS, useValue: DEFAULT_RESILIENCE_OPTIONS }, ResilienceService],
  exports: [ResilienceService],
})
export class ResilienceModule {
  static forRoot(options: ResilienceOptionsMap = DEFAULT_RESILIENCE_OPTIONS): DynamicModule {
    return {
      module: ResilienceModule,
      global: true,
      providers: [{ provide: RESILIENCE_OPTIONS, useValue: options }, ResilienceService],
      exports: [ResilienceService],
    };
  }
}
