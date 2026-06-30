import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { CreateTcpInvoiceRequest, SendInvoiceTcpReq } from '@common/interfaces/tcp/invoice';
import { InvoiceRequestMapper } from '../mappers';
import { INVOICE_STATUS } from '@common/constants/enum/invoice.enum';
import { ERROR_CODE } from '@common/constants/enum/error-code.enum';
import { ObjectId } from 'mongodb';
import { KafkaService } from '@common/kafka/services/kafka.service';
import { InvoiceSentPayload } from '@common/interfaces/queue/invoice';
import { SagaService } from '@common/saga/saga.service';
import { InvoiceSendSagaContext } from '@common/interfaces/saga/saga-step.interface';
import { InvoiceSendSagaSteps } from '../sagas/invoice-send-saga-steps.service';
import { SAGA_TYPE } from '@common/constants/enum/saga.enum';
import { IdempotencyService, IDEMPOTENCY_SCOPE } from '@common/idempotency';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly kafkaService: KafkaService,
    private readonly sagaSteps: InvoiceSendSagaSteps,
    private readonly sagaOrchestation: SagaService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  create(params: CreateTcpInvoiceRequest) {
    const idempotency = params.idempotency;

    return this.idempotencyService.run(
      {
        scope: idempotency?.scope || IDEMPOTENCY_SCOPE.INVOICE_CREATE,
        key: idempotency?.key || '',
        requestHash: idempotency?.requestHash || '',
      },
      async () => {
        Logger.debug('>>>>>>>>>>>>>>> TCP Request: ', params);
        const input = InvoiceRequestMapper(params);
        return this.invoiceRepository.create(input);
      },
    );
  }

  async sendById(params: SendInvoiceTcpReq, processId: string) {
    const { invoiceId, userId } = params;
    const idempotency = params.idempotency;

    if (!ObjectId.isValid(invoiceId)) {
      throw new BadRequestException('Invalid invoice id');
    }

    if (!ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    return this.idempotencyService.run(
      {
        scope: idempotency?.scope || IDEMPOTENCY_SCOPE.INVOICE_SEND,
        key: idempotency?.key || '',
        requestHash: idempotency?.requestHash || '',
        ttlMs: 72 * 60 * 60 * 1000,
        lockMs: 5 * 60 * 1000,
      },
      async () => {
        const invoice = await this.invoiceRepository.findById(invoiceId);

        if (!invoice) {
          this.logger.error(`Invoice not found: ${invoiceId}`);
          throw new Error('Invoice not found');
        }

        if (invoice.status !== INVOICE_STATUS.CREATED) {
          this.logger.error(`Invoice ${invoiceId} is not in a sendable state`);
          throw new BadRequestException(ERROR_CODE.INVOICE_CAN_NOT_BE_SENT);
        }

        const context: InvoiceSendSagaContext = {
          sagaId: idempotency?.key || '',
          invoiceId,
          userId,
          processId,
        };

        const steps = this.sagaSteps.getSteps(invoice);

        try {
          await this.sagaOrchestation.execute(SAGA_TYPE.INVOICE_SEND, steps, context);

          this.kafkaService.emit<InvoiceSentPayload>('invoice-sent', {
            id: invoiceId,
            paymentLink: context.paymentLink || '',
          });

          return HTTP_MESSAGE.OK;
        } catch (error: any) {
          this.logger.error(`Failed to send invoice ${invoiceId}: ${error.message}`);
          throw error;
        }
      },
    );
  }

  updateInvoicePaid(invoiceId: string) {
    return this.invoiceRepository.markPaidIfUnpaid(invoiceId);
  }

  getById(id: string) {
    return this.invoiceRepository.findById(id);
  }
}
