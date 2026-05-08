import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptor';
import { Response } from '@common/interfaces/tcp/common/response.interface';
import { ProcessId } from '@common/decorators/processId.decorator';
import { RequestParams } from '@common/decorators/request-param.decorator';
import { Logger } from '@nestjs/common';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get_invoice')
  getInvoice(
    @ProcessId() processId: string,
    @RequestParams() params: { invoiceId: number; invoiceName: string },
    @RequestParams('invoiceName') invoiceName: string,
  ): Response<string> {
    Logger.debug(
      `Received get_invoice request with processId: ${processId}, invoiceId: ${params.invoiceId}, invoiceName: ${invoiceName}`,
    );

    return Response.success(`Invoice ${params.invoiceId}: ${invoiceName}`);
  }
}
