import { Invoice } from '@common/schemas/invoice.schema';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InvoiceSendSagaContext, SagaStep, SagaStepResult } from '@common/interfaces/saga/saga-step.interface';
import { firstValueFrom, map } from 'rxjs';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { PaymentService } from '../../payment/services/payment.service';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { UploadFileTcpReq, UploadFileTcpRes } from '@common/interfaces/tcp/media';
import { createCheckoutSessionMapping } from '../mappers';
import { INVOICE_STATUS } from '@common/constants/enum/invoice.enum';
import { ObjectId } from 'mongodb';

@Injectable()
export class InvoiceSendSagaSteps {
  private readonly logger = new Logger(InvoiceSendSagaSteps.name);

  constructor(
    @Inject(TCP_SERVICES.PDF_GENERATOR_SERVICE) private readonly pdfGeneratorClient: TcpClient,
    @Inject(TCP_SERVICES.MEDIA_SERVICE) private readonly mediaClient: TcpClient,
    private readonly paymentService: PaymentService,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  getSteps(invoice: Invoice): SagaStep<InvoiceSendSagaContext>[] {
    return [
      {
        name: 'GENERATE_PDF',
        execute: async (context: InvoiceSendSagaContext): Promise<SagaStepResult> => {
          try {
            this.logger.log(`Generating PDF for invoice ${context.invoiceId}`);

            const pdfBase64 = await firstValueFrom(
              this.pdfGeneratorClient
                .send<string, Invoice>(TCP_REQUEST_MESSAGE.PDF_GENERATOR.CREATE_INVOICE_PDF, {
                  data: invoice,
                  processId: context.processId,
                })
                .pipe(map((data) => data.data)),
            );

            return {
              success: true,
              data: { pdfBase64 },
            };
          } catch (error: any) {
            this.logger.error(`Failed to generate PDF: ${error.message}`);
            return {
              success: false,
              error: error.message,
            };
          }
        },
      },
      {
        name: 'UPLOAD_FILE',
        execute: async (context: InvoiceSendSagaContext): Promise<SagaStepResult> => {
          try {
            this.logger.log(`Uploading file for invoice ${context.invoiceId}`);

            if (!context.pdfBase64) {
              throw new NotFoundException('PDF not found in context');
            }

            const result = await firstValueFrom(
              this.mediaClient
                .send<UploadFileTcpRes, UploadFileTcpReq>(TCP_REQUEST_MESSAGE.MEDIA.UPLOAD_FILE, {
                  data: {
                    fileBase64: context.pdfBase64,
                    fileName: `invoice-${context.invoiceId}`,
                  },
                  processId: context.processId,
                })
                .pipe(map((data) => data.data)),
            );

            return {
              success: true,
              data: { fileUrl: result?.url, filePublicId: result?.publicId },
            };
          } catch (error: any) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            return {
              success: false,
              error: error.message,
            };
          }
        },
        compensate: async (context: InvoiceSendSagaContext): Promise<void> => {
          try {
            if (context.fileUrl && context.filePublicId) {
              this.logger.log(`Compensating file upload for invoice ${context.invoiceId}`);
              await firstValueFrom(
                this.mediaClient
                  .send<string, { filePublicId: string }>(TCP_REQUEST_MESSAGE.MEDIA.DESTROY_FILE, {
                    data: context.filePublicId,
                    processId: context.processId,
                  })
                  .pipe(map((data) => data.data)),
              );
            }
            this.logger.warn(
              `File deletion implemented for invoice ${context.invoiceId} compensation, fileUrl: ${context.fileUrl}`,
            );
          } catch (error: any) {
            this.logger.error(`Failed to compensate file upload: ${error.message}`);
          }
        },
      },
      {
        name: 'CREATE_PAYMENT',
        execute: async (context: InvoiceSendSagaContext): Promise<SagaStepResult> => {
          try {
            this.logger.log(`Creating payment session for invoice ${context.invoiceId}`);

            const checkoutData = await this.paymentService.createCheckoutSession({
              ...createCheckoutSessionMapping(invoice),
              idempotencyKey: `invoice-payment:${context.invoiceId}`,
            });

            return {
              success: true,
              data: { paymentLink: checkoutData.url, sessionId: checkoutData.sessionId },
            };
          } catch (error: any) {
            this.logger.error(`Failed to create payment session: ${error.message}`);
            return {
              success: false,
              error: error.message,
            };
          }
        },
        compensate: async (context: InvoiceSendSagaContext): Promise<void> => {
          try {
            if (context.paymentLink) {
              if (!context.sessionId) {
                this.logger.error(`No sessionId found in context for invoice ${context.invoiceId} compensation`);
                return;
              }
              this.logger.log(`Compensating payment creation for invoice ${context.invoiceId}`);
              await this.paymentService.expireCheckoutSession(context.sessionId);
              this.logger.warn(`Payment cancellation implemented. Payment link: ${context.paymentLink}`);
            }
          } catch (error: any) {
            this.logger.error(`Failed to compensate payment creation: ${error.message}`);
          }
        },
      },
      {
        name: 'UPDATE_INVOICE',
        execute: async (context: InvoiceSendSagaContext): Promise<SagaStepResult> => {
          try {
            this.logger.log(`Updating invoice ${context.invoiceId} status to SENT`);

            await this.invoiceRepository.update(context.invoiceId, {
              status: INVOICE_STATUS.SENT,
              supervisorId: new ObjectId(context.userId),
              fileUrl: context.fileUrl,
            });

            return {
              success: true,
            };
          } catch (error: any) {
            this.logger.error(`Failed to update invoice: ${error.message}`);
            return {
              success: false,
              error: error.message,
            };
          }
        },

        compensate: async (context: InvoiceSendSagaContext): Promise<void> => {
          try {
            this.logger.log(`Compensating invoice update for invoice ${context.invoiceId}`);

            await this.invoiceRepository.update(context.invoiceId, {
              status: INVOICE_STATUS.CREATED,
              supervisorId: undefined,
              fileUrl: undefined,
            });

            this.logger.log(`Invoice ${context.invoiceId} status reverted to CREATED`);
          } catch (error: any) {
            this.logger.error(`Failed to compensate invoice update: ${error.message}`);
          }
        },
      },
    ];
  }
}
