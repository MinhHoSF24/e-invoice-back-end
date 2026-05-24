import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SagaInstanceDestination } from '@common/schemas/saga.schema';
import { SagaRepository } from './saga.repository';
import { SagaService } from './saga.service';

@Module({})
export class SagaModule {
  static forRoot() {
    return {
      module: SagaModule,
      global: true,
      imports: [MongooseModule.forFeature([SagaInstanceDestination])],
      providers: [SagaRepository, SagaService],
      exports: [SagaService],
    };
  }
}
