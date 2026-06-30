import { CreateCheckoutSessionRequest } from '@common/interfaces/common/stripe.interface';
import { CreateTcpInvoiceRequest } from '@common/interfaces/tcp/invoice';
import { Invoice } from '@common/schemas/invoice.schema';

export const InvoiceRequestMapper = (data: CreateTcpInvoiceRequest): Partial<Invoice> => {
  const { idempotency: _idempotency, ...invoiceData } = data;

  return {
    ...invoiceData,
    totalAmount: data.item.reduce((acc, item) => acc + item.total, 0),
    vatAmount: data.item.reduce((acc, item) => acc + item.quantity * item.unitPrice * (item.vatRate / 100), 0),
  };
};

export const createCheckoutSessionMapping = (invoice: Invoice): CreateCheckoutSessionRequest => {
  return {
    invoiceId: invoice.id || '',
    clientEmail: invoice.client.email,
    lineItems: invoice.item.map((item: any) => ({
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
    })),
  };
};
