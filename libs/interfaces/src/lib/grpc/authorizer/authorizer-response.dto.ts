import { AuthorizerResponse } from '../../tcp/authorizer';

export type VerifyUserTokenResponse = {
  code: string;
  error: string;
  data?: AuthorizerResponse;
};
