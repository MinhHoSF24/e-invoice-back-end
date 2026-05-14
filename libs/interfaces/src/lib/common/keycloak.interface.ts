export type ExchangeTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  token_type: string;
  id_token: string;
  scope: string;
};

export type ExchangeUserTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
};

export type CreateKeycloakUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
