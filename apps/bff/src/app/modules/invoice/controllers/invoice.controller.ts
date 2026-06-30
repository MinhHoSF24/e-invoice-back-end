import { BadRequestException, Body, Controller, Inject, Logger, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateInvoiceRequestDto, InvoiceResponseDTO } from '@common/interfaces/gateway/invoice';
import { ResponseDTO } from '@common/interfaces/gateway/response.interface';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { CreateTcpInvoiceRequest, InvoiceTcpResponse, SendInvoiceTcpReq } from '@common/interfaces/tcp/invoice';
import { ProcessId } from '@common/decorators/processId.decorator';
import { map } from 'rxjs';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { Permissions } from '@common/decorators/permission.decorator';
import { UserData } from '@common/decorators/user-data.decorator';
import { AuthorizerMetaData } from '@common/interfaces/tcp/authorizer';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { createRequestHash, IdempotencyKey, IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_SCOPE } from '@common/idempotency';

@ApiTags('Invoice')
@Controller('invoice')
export class InvoiceController {
  constructor(@Inject(TCP_SERVICES.INVOICE_SERVICE) private readonly invoiceClient: TcpClient) {}

  @Post()
  @ApiOkResponse({ type: ResponseDTO<InvoiceResponseDTO> })
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiHeader({
    name: IDEMPOTENCY_KEY_HEADER,
    required: true,
    description: 'Unique key for safely retrying the same invoice create request',
    example: 'invoice-create-20260629-001',
  })
  @Authorization({ secured: true })
  @Permissions([PERMISSION.INVOICE_CREATE, PERMISSION.INVOICE_GET_BY_ID])
  create(
    @Body() body: CreateInvoiceRequestDto,
    @ProcessId() processId: string,
    @UserData() userData: AuthorizerMetaData,
    @IdempotencyKey() idempotencyKey?: string,
  ) {
    Logger.debug('User Data >>>>>>>', userData);

    return this.invoiceClient
      .send<InvoiceTcpResponse, CreateTcpInvoiceRequest>(TCP_REQUEST_MESSAGE.INVOICE.CREATE, {
        data: {
          ...body,
          idempotency: this.buildIdempotencyContext(IDEMPOTENCY_SCOPE.INVOICE_CREATE, idempotencyKey, body),
        },
        processId,
      })
      .pipe(map((data) => new ResponseDTO(data)));
  }

  @Post(':id/send')
  @ApiOkResponse({ type: ResponseDTO<string> })
  @ApiOperation({
    summary: 'Send invoice by id',
  })
  @ApiHeader({
    name: IDEMPOTENCY_KEY_HEADER,
    required: true,
    description: 'Unique key for safely retrying the same invoice send request',
    example: 'invoice-send-20260629-001',
  })
  @Authorization({ secured: true })
  @Permissions([PERMISSION.INVOICE_SEND])
  send(
    @Param('id') id: string,
    @ProcessId() processId: string,
    @UserData() userData: AuthorizerMetaData,
    @IdempotencyKey() idempotencyKey?: string,
  ) {
    const supervisorId = userData?.user?.id || userData?.user?._id?.toString() || '';
    const command = { invoiceId: id, userId: supervisorId };

    return this.invoiceClient
      .send<string, SendInvoiceTcpReq>(TCP_REQUEST_MESSAGE.INVOICE.SEND, {
        data: {
          ...command,
          idempotency: this.buildIdempotencyContext(IDEMPOTENCY_SCOPE.INVOICE_SEND, idempotencyKey, command),
        },
        processId,
      })
      .pipe(map((data) => new ResponseDTO(data)));
  }

  private buildIdempotencyContext(scope: string, key: string | undefined, payload: unknown) {
    if (!key) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    return {
      key,
      scope,
      requestHash: createRequestHash(payload),
    };
  }
}
