import { CreateInvoiceRequestDto } from '../../gateway/invoice';
import { IdempotencyContext } from '@common/idempotency';

export type CreateTcpInvoiceRequest = CreateInvoiceRequestDto & {
  idempotency?: IdempotencyContext;
};

export type SendInvoiceTcpReq = {
  invoiceId: string;
  userId: string;
  idempotency?: IdempotencyContext;
};
