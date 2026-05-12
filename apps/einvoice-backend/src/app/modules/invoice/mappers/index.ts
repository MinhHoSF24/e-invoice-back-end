import { CreateTcpInvoiceRequest } from '@common/interfaces/tcp/invoice';
import { Invoice } from '@common/schemas/invoice.schema';

export const InvoiceRequestMapper = (data: CreateTcpInvoiceRequest): Partial<Invoice> => {
  return {
    ...data,
    totalAmount: data.item.reduce((acc, item) => acc + item.total, 0),
    vatAmount: data.item.reduce((acc, item) => acc + item.quantity * item.unitPrice * (item.vatRate / 100), 0),
  };
};
