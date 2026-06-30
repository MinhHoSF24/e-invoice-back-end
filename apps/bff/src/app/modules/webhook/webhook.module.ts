import { Module } from '@nestjs/common';
import { WebhookController } from './controllers/webhook.controller';
import { StripeWebhookService } from './services/stripe-webhook.service';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';
import { IdempotencyModule } from '@common/idempotency';

@Module({
  imports: [IdempotencyModule.forRoot()],
  controllers: [WebhookController],
  providers: [StripeWebhookService, TcpProvider(TCP_SERVICES.INVOICE_SERVICE)],
})
export class WebhookModule {}
