import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptor';
import { Response } from '@common/interfaces/tcp/common/response.interface';
import { RequestParams } from '@common/decorators/request-param.decorator';
import { InvoiceService } from '../services/invoice.service';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { CreateTcpInvoiceRequest, InvoiceTcpResponse } from '@common/interfaces/tcp/invoice';
import { SendInvoiceTcpReq } from '@common/interfaces/tcp/invoice';
import { ProcessId } from '@common/decorators/processId.decorator';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @MessagePattern(TCP_REQUEST_MESSAGE.INVOICE.CREATE)
  async create(@RequestParams() params: CreateTcpInvoiceRequest): Promise<Response<InvoiceTcpResponse>> {
    const result = await this.invoiceService.create(params);
    return Response.success<InvoiceTcpResponse>(result);
  }

  @MessagePattern(TCP_REQUEST_MESSAGE.INVOICE.SEND)
  async sendById(
    @RequestParams() params: SendInvoiceTcpReq,
    @ProcessId() processID: string,
  ): Promise<Response<string>> {
    const result = await this.invoiceService.sendById(params, processID);
    if (!result) {
      throw new Error('Failed to send invoice');
    }
    return Response.success<string>(result);
  }

  @MessagePattern(TCP_REQUEST_MESSAGE.INVOICE.UPDATE_INVOICE_PAID)
  async updateInvoicePaid(@RequestParams() invoiceId: string): Promise<Response<string>> {
    await this.invoiceService.updateInvoicePaid(invoiceId);
    return Response.success<string>(HTTP_MESSAGE.UPDATED);
  }
}
