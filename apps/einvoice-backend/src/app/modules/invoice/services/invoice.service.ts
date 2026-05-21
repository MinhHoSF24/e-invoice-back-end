import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { CreateTcpInvoiceRequest, SendInvoiceTcpReq } from '@common/interfaces/tcp/invoice';
import { createCheckoutSessionMapping, InvoiceRequestMapper } from '../mappers';
import { INVOICE_STATUS } from '@common/constants/enum/invoice.enum';
import { ERROR_CODE } from '@common/constants/enum/error-code.enum';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { Invoice } from '@common/schemas/invoice.schema';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { map } from 'rxjs/internal/operators/map';
import { ObjectId } from 'mongodb';
import { UploadFileTcpReq } from '@common/interfaces/tcp/media';
import { PaymentService } from '../../payment/services/payment.service';
import { KafkaService } from '@common/kafka/services/kafka.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(TCP_SERVICES.PDF_GENERATOR_SERVICE) private readonly pdfGeneratorClient: TcpClient,
    @Inject(TCP_SERVICES.MEDIA_SERVICE) private readonly mediaClient: TcpClient,
    private readonly paymentService: PaymentService,
    private readonly kafkaService: KafkaService,
  ) {}

  create(params: CreateTcpInvoiceRequest) {
    //calculate total amount and vat amount
    Logger.debug('>>>>>>>>>>>>>>> TCP Request: ', params);
    const input = InvoiceRequestMapper(params);
    //save to database
    return this.invoiceRepository.create(input);
  }

  async sendById(params: SendInvoiceTcpReq, processId: string) {
    const { invoiceId, userId } = params;

    if (!ObjectId.isValid(invoiceId)) {
      throw new BadRequestException('Invalid invoice id');
    }

    if (!ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== INVOICE_STATUS.CREATED) {
      throw new BadRequestException(ERROR_CODE.INVOICE_CAN_NOT_BE_SENT);
    }

    const pdfBase64 = await this.generatorInvoicePdf(invoice, processId);
    if (!pdfBase64) {
      throw new Error('Failed to generate PDF');
    }

    const fileUrl = await this.uploadFile({ fileBase64: pdfBase64, fileName: `invoice-${invoiceId}` }, processId);

    const checkoutData = await this.paymentService.createCheckoutSession(createCheckoutSessionMapping(invoice));

    await this.invoiceRepository.update(invoiceId, {
      status: INVOICE_STATUS.SENT,
      supervisorId: new ObjectId(userId),
      fileUrl,
    });

    this.kafkaService.emit('invoice-sent', {
      invoiceId,
      clientEmail: invoice.client.email,
    });

    return checkoutData.url;
  }

  generatorInvoicePdf(data: Invoice, processId: string) {
    return firstValueFrom(
      this.pdfGeneratorClient
        .send<string, Invoice>(TCP_REQUEST_MESSAGE.PDF_GENERATOR.CREATE_INVOICE_PDF, {
          data,
          processId,
        })
        .pipe(map((data) => data.data)),
    );
  }

  uploadFile(data: UploadFileTcpReq, processId: string) {
    return firstValueFrom(
      this.mediaClient
        .send<string, UploadFileTcpReq>(TCP_REQUEST_MESSAGE.MEDIA.UPLOAD_FILE, {
          data,
          processId,
        })
        .pipe(map((data) => data.data)),
    );
  }

  updateInvoicePaid(invoiceId: string) {
    return this.invoiceRepository.update(invoiceId, { status: INVOICE_STATUS.PAID });
  }
}
