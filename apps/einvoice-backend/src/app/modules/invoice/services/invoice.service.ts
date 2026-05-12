import { Injectable, Logger } from '@nestjs/common';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { CreateTcpInvoiceRequest } from '@common/interfaces/tcp/invoice';
import { InvoiceRequestMapper } from '../mappers';

@Injectable()
export class InvoiceService {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  create(params: CreateTcpInvoiceRequest) {
    //calculate total amount and vat amount
    Logger.debug('>>>>>>>>>>>>>>> TCP Request: ', params);
    const input = InvoiceRequestMapper(params);
    //save to database
    return this.invoiceRepository.create(input);
  }
}
