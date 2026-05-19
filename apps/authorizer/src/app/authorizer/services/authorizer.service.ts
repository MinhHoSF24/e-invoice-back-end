import { AuthorizerResponse, LoginTcpRequest } from '@common/interfaces/tcp/authorizer';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { KeycloakHttpService } from '../../keycloak/services/keycloak-http.service';
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken';
import jwksRsa, { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map } from 'rxjs';
import { Role } from '@common/schemas/role.schema';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { ClientGrpc } from '@nestjs/microservices';
import { UserAccessService } from '@common/interfaces/grpc/user-access';

@Injectable()
export class AuthorizerService {
  private readonly logger = new Logger(AuthorizerService.name);
  private jwksClient: JwksClient;
  private userAccessService: UserAccessService;

  constructor(
    private readonly keycloakHttpService: KeycloakHttpService,
    private readonly configService: ConfigService,
    @Inject(GRPC_SERVICES.USER_ACCESS_SERVICE) private readonly grpcUserAccessClient: ClientGrpc,
  ) {
    const host = this.configService.get('KEYCLOAK_CONFIG.HOST');
    const realm = this.configService.get('KEYCLOAK_CONFIG.REALM');
    this.jwksClient = jwksRsa({
      jwksUri: `${host}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  onModuleInit() {
    this.userAccessService = this.grpcUserAccessClient.getService<UserAccessService>('UserAccessService');
  }

  async login(params: LoginTcpRequest) {
    Logger.debug(`Received login request for user: ${params.username}`, AuthorizerService.name);
    const { username, password } = params;

    const { access_token: accessToken, refresh_token: refreshToken } = await this.keycloakHttpService.exchangeUserToken(
      {
        username,
        password,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyUserToken(token: string, processId: string): Promise<AuthorizerResponse> {
    const decode = jwt.decode(token, { complete: true }) as Jwt;

    if (!decode || !decode.header || !decode.header.kid) {
      throw new UnauthorizedException('Invalid token structure');
    }

    try {
      const key = await this.jwksClient.getSigningKey(decode.header.kid);
      const publicKey = key.getPublicKey();
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
      Logger.debug(`Token verified successfully for processId: ${processId}`, AuthorizerService.name);

      Logger.debug(`Token payload for processId ${processId}: ${JSON.stringify(payload)}`, AuthorizerService.name);
      if (!payload.sub) {
        throw new UnauthorizedException('Token subject missing');
      }

      const user = await this.userValidation(payload.sub, processId);

      Logger.debug('User data : >>>>>>', user, AuthorizerService.name);
      return {
        valid: true,
        metaData: {
          jwt: payload,
          permissions: (user.roles as unknown as Role[]).map((role) => role.permissions).flat(),
          user,
          userId: user.userId,
        },
      };
    } catch (error) {
      Logger.error(`Error verifying token for processId: ${processId}`, error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async userValidation(userId: string, processId: string) {
    const user = await firstValueFrom(
      this.userAccessService.getByUserId({ processId, userId }).pipe(map((data) => data.data)),
    );
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
