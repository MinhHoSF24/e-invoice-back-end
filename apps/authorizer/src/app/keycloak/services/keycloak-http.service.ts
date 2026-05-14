import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  CreateKeycloakUserRequest,
  ExchangeTokenResponse,
  ExchangeUserTokenResponse,
} from '@common/interfaces/common/keycloak.interface';
import { LoginTcpRequest } from '@common/interfaces/tcp/authorizer';

@Injectable()
export class KeycloakHttpService {
  private readonly logger = new Logger(KeycloakHttpService.name);
  private readonly axiosInstance: AxiosInstance;
  private realm: string;
  private clientId: string;
  private clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.getOrThrow<string>('KEYCLOAK_CONFIG.HOST'),
    });
    this.realm = this.configService.getOrThrow<string>('KEYCLOAK_CONFIG.REALM');
    this.clientId = this.configService.getOrThrow<string>('KEYCLOAK_CONFIG.CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>('KEYCLOAK_CONFIG.CLIENT_SECRET');
  }

  async exchangeClientToken(): Promise<ExchangeTokenResponse> {
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', this.clientId);
    body.append('client_secret', this.clientSecret);
    body.append('scope', 'openid');

    const { data } = await this.axiosInstance.post(`/realms/${this.realm}/protocol/openid-connect/token`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return data;
  }

  async createUser(data: CreateKeycloakUserRequest): Promise<string> {
    const { email, password, firstName, lastName } = data;

    const { access_token } = await this.exchangeClientToken();

    const { headers } = await this.axiosInstance.post(
      `/admin/realms/${this.realm}/users`,
      {
        username: email,
        email,
        firstName,
        emailVerified: true,
        lastName,
        enabled: true,
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const userId = headers['location']?.split('/')?.pop();

    if (!userId) {
      this.logger.error(`Failed to create user in Keycloak. Response headers: ${JSON.stringify(headers)}`);
      throw new InternalServerErrorException('Failed to create user in Keycloak');
    }
    this.logger.log(`User created in Keycloak with ID: ${userId}`);
    return userId;
  }

  async exchangeUserToken(params: LoginTcpRequest): Promise<ExchangeUserTokenResponse> {
    const body = new URLSearchParams();
    body.append('client_id', this.clientId);
    body.append('client_secret', this.clientSecret);
    body.append('grant_type', 'password');
    body.append('scope', 'openid');
    body.append('username', params.username);
    body.append('password', params.password);

    const { data } = await this.axiosInstance.post(`/realms/${this.realm}/protocol/openid-connect/token`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return data;
  }
}
