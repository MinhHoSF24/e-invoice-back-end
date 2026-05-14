import { AuthorizerResponse, LoginTcpRequest } from '@common/interfaces/tcp/authorizer';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { KeycloakHttpService } from '../../keycloak/services/keycloak-http.service';
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken';
import jwksRsa, { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthorizerService {
  private readonly logger = new Logger(AuthorizerService.name);
  private jwksClient: JwksClient;

  constructor(
    private readonly keycloakHttpService: KeycloakHttpService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get('KEYCLOAK_CONFIG.HOST');
    const realm = this.configService.get('KEYCLOAK_CONFIG.REALM');
    this.jwksClient = jwksRsa({
      jwksUri: `${host}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
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
      return {
        valid: true,
        metaData: {
          jwt: payload,
          permissions: [],
          user: undefined,
          userId: undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Error verifying token for processId: ${processId}`, error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
