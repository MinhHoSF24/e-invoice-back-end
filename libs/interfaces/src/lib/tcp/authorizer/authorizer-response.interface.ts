import { User } from '@common/schemas/user.schema';
import { LoginResponseDto } from '../../gateway/authorizer';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { JwtPayload } from 'jsonwebtoken';

export type LoginTcpResponse = LoginResponseDto;

export class AuthorizerMetaData {
  userId: string | undefined;
  user: User | undefined;
  permissions: PERMISSION[] | undefined;
  jwt: JwtPayload | undefined;

  constructor(payload?: Partial<AuthorizerMetaData>) {
    Object.assign(this, payload);
  }
}

export class AuthorizerResponse {
  valid = false;
  metaData = new AuthorizerMetaData();

  constructor(payload?: Partial<AuthorizerResponse>) {
    Object.assign(this, payload);
  }
}
