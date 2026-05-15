import { CanActivate, ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { MetaDataKeys } from '@common/constants/common.constants';
import { getAccessToken } from '@common/utils/request.util';
import { TCP_REQUEST_MESSAGE } from '@common/constants/enum/tcp-request-message.enum';
import { TCP_SERVICES } from '@common/configuration/tcp.config';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { AuthorizerResponse } from '@common/interfaces/tcp/authorizer';
import { setUserData } from '@common/utils/request.util';

@Injectable()
export class UserGuard implements CanActivate {
  private readonly logger = new Logger(UserGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(TCP_SERVICES.AUTHORIZE_SERVICE) private readonly authorizerClient: TcpClient,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const authOptions = this.reflector.get<{ secured: boolean }>(MetaDataKeys.SECURED, context.getHandler());

    const request = context.switchToHttp().getRequest();

    if (!authOptions?.secured) {
      return true;
    }

    return this.verifyToken(request);
  }

  private async verifyToken(req: any): Promise<boolean> {
    try {
      const token = getAccessToken(req);
      const processId = req[MetaDataKeys.PROCESS_ID];
      const result = await this.verifyUserToken(token, processId);
      if (!result?.valid) {
        throw new UnauthorizedException('Token is invalid');
      }

      setUserData(req, result);

      return true;
    } catch (error) {
      this.logger.error('Error verifying token', error);
      throw new UnauthorizedException('Token is invalid');
    }
  }

  private async verifyUserToken(token: string, processId: string) {
    return firstValueFrom(
      this.authorizerClient
        .send<AuthorizerResponse, string>(TCP_REQUEST_MESSAGE.AUTHORIZER.VERIFY_USER_TOKEN, {
          data: token,
          processId,
        })
        .pipe(map((data) => data.data)),
    );
  }
}
