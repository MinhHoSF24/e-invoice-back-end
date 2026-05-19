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
import { ClientGrpc } from '@nestjs/microservices';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { AuthorizerService } from '@common/interfaces/grpc/authorizer';

@Injectable()
export class UserGuard implements CanActivate {
  private readonly logger = new Logger(UserGuard.name);
  private authorizerService: AuthorizerService;

  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(GRPC_SERVICES.AUTHORIZER_SERVICE) private readonly grpcAuthorizerClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authorizerService = this.grpcAuthorizerClient.getService<AuthorizerService>('AuthorizerService');
  }

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
      const response = await firstValueFrom(this.authorizerService.verifyUserToken({ processId, token }));
      Logger.debug('Token verification response >>>>>>>>>', response, UserGuard.name);

      const { data: result } = response;
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

  generateTokenCacheKey(token: string): string {
    const hash = createHash('sha256').update(token).digest('hex');
    return `user-token:${hash}`;
  }
}
