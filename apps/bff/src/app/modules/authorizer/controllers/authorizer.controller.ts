import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseDTO } from '@common/interfaces/gateway/response.interface';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { map } from 'rxjs/internal/operators/map';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { ProcessId } from '@common/decorators/processId.decorator';
import { LoginRequestDto, LoginResponseDto } from '@common/interfaces/gateway/authorizer';
import { LoginTcpRequest, LoginTcpResponse } from '@common/interfaces/tcp/authorizer';

@ApiTags('Authorizer')
@Controller('authorizer')
export class AuthorizerController {
  constructor(@Inject(TCP_SERVICES.AUTHORIZE_SERVICE) private readonly authorizeClient: TcpClient) {}

  @Post('login')
  @ApiOkResponse({
    type: ResponseDTO<LoginResponseDto>,
  })
  @ApiOperation({
    summary: 'Login endpoint for user authentication',
  })
  // @Authorization({ secured: false })
  login(@Body() body: LoginRequestDto, @ProcessId() processId: string) {
    return this.authorizeClient
      .send<LoginTcpResponse, LoginTcpRequest>(TCP_REQUEST_MESSAGE.AUTHORIZER.LOGIN, {
        data: body,
        processId,
      })
      .pipe(map((response) => new ResponseDTO(response)));
  }
}
