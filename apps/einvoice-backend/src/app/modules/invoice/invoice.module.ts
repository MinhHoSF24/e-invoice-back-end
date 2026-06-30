import { MongoProvider } from '@common/configuration/mongo.config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceDestination } from '@common/schemas/invoice.schema';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { InvoiceRepository } from './repositories/invoice.repository';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';
import { PaymentModule } from '../payment/payment.module';
import { KafkaModule } from '@common/kafka/kafka.module';
import { QUEUE_SERVICES } from '@common/constants/enum/queue.enum';
import { SagaModule } from '@common/saga/saga.module';
import { InvoiceSendSagaSteps } from './sagas/invoice-send-saga-steps.service';
import { ResilienceModule } from '@common/resilience';
import { IdempotencyModule } from '@common/idempotency';

@Module({
  imports: [
    MongoProvider,
    MongooseModule.forFeature([InvoiceDestination]),
    PaymentModule,
    KafkaModule.register(QUEUE_SERVICES.INVOICE),
    SagaModule.forRoot(),
    ResilienceModule.forRoot(),
    IdempotencyModule.forRoot(),
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    InvoiceRepository,
    InvoiceSendSagaSteps,
    TcpProvider(TCP_SERVICES.PDF_GENERATOR_SERVICE, { resilient: true }),
    TcpProvider(TCP_SERVICES.MEDIA_SERVICE, { resilient: true }),
  ],
})
export class InvoiceModule {}
