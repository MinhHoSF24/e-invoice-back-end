import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { map } from 'rxjs';
import { ResponseDTO } from '@common/interfaces/gateway/response.interface';
import { ProcessId } from '@common/decorators/processId.decorator';

@Controller('app')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('TCP_INVOICE_SERVICE') private readonly invoiceService: TcpClient,
  ) {}

  @Get()
  getData() {
    const rs = this.appService.getData();
    return new ResponseDTO({
      data: rs,
    });
  }

  @Get('invoice')
  async getInvoice(@ProcessId() processId: string) {
    return this.invoiceService
      .send<string, { invoiceId: number; invoiceName: string }>('get_invoice', {
        processId,
        data: {
          invoiceId: 123,
          invoiceName: 'Test Invoice',
        },
      })
      .pipe(map((data) => new ResponseDTO<string>(data)));
  }
}
