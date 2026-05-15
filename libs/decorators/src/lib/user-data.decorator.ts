import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MetaDataKeys } from '@common/constants/common.constants';
import { AuthorizerResponse } from '@common/interfaces/tcp/authorizer';

export const UserData = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  const userData = request[MetaDataKeys.USER_DATA] as AuthorizerResponse;

  if (!userData) {
    throw new UnauthorizedException('User data not found in request');
  }

  return userData?.metaData;
});
