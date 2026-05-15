import { parseToken } from './string.util';
import { MetaDataKeys } from '@common/constants/common.constants';
import { AuthorizerResponse } from '@common/interfaces/tcp/authorizer';

export function getAccessToken(req: any, keepBearer = false): string {
  const token = req?.headers?.['authorization'] || req?.headers?.['Authorization'];

  return keepBearer ? token : parseToken(token);
}

export function setUserData(req: any, userData?: AuthorizerResponse): void {
  req[MetaDataKeys.USER_DATA] = userData;
}
