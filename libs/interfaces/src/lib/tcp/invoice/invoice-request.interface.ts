import { CreateInvoiceRequestDto } from '../../gateway/invoice';

export type CreateTcpInvoiceRequest = CreateInvoiceRequestDto;

export type SendInvoiceTcpReq = {
  invoiceId: string;
  userId: string;
};
