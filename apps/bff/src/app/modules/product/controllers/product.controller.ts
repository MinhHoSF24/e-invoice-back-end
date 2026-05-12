import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseDTO } from '@common/interfaces/gateway/response.interface';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { ProcessId } from '@common/decorators/processId.decorator';
import { map } from 'rxjs';
import { CreateTcpProductRequest, ProductTcpResponse } from '@common/interfaces/tcp/product';
import { CreateProductRequestDto, ProductResponseDTO } from '@common/interfaces/gateway/product';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(@Inject(TCP_SERVICES.PRODUCT_SERVICE) private readonly productClient: TcpClient) {}

  @Post()
  @ApiOkResponse({ type: ResponseDTO<ProductResponseDTO> })
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() body: CreateProductRequestDto, @ProcessId() processId: string) {
    return this.productClient
      .send<ProductTcpResponse, CreateTcpProductRequest>(TCP_REQUEST_MESSAGE.PRODUCT.CREATE, {
        data: body,
        processId,
      })
      .pipe(map((data) => new ResponseDTO(data)));
  }

  @Get()
  @ApiOkResponse({ type: ResponseDTO<ProductResponseDTO[]> })
  @ApiOperation({ summary: 'Get all products' })
  getList(@ProcessId() processId: string) {
    return this.productClient
      .send<ProductTcpResponse[]>(TCP_REQUEST_MESSAGE.PRODUCT.GET_LIST, {
        processId,
      })
      .pipe(map((data) => new ResponseDTO(data)));
  }
}
