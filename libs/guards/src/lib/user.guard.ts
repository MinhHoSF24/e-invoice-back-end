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
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createHash } from 'crypto';

@Injectable()
export class UserGuard implements CanActivate {
  private readonly logger = new Logger(UserGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(TCP_SERVICES.AUTHORIZE_SERVICE) private readonly authorizerClient: TcpClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
      const cacheKey = this.generateTokenCacheKey(token);

      // Check cache first
      const cachedResult = await this.cacheManager.get<AuthorizerResponse>(cacheKey);
      if (cachedResult) {
        Logger.debug('Cache hit for token verification', UserGuard.name);
        if (!cachedResult.valid) {
          throw new UnauthorizedException('Token is invalid');
        }
        setUserData(req, cachedResult);
        return true;
      }

      const processId = req[MetaDataKeys.PROCESS_ID];
      const result = await this.verifyUserToken(token, processId);
      if (!result?.valid) {
        throw new UnauthorizedException('Token is invalid');
      }

      setUserData(req, result);
      // Cache the result for future requests
      Logger.debug('Caching token verification result: %s', cacheKey, UserGuard.name);
      await this.cacheManager.set(cacheKey, result, 30 * 60 * 1000); // Cache for 5 minutes

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

  generateTokenCacheKey(token: string): string {
    const hash = createHash('sha256').update(token).digest('hex');
    return `user-token:${hash}`;
  }
}
