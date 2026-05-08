import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestParams = createParamDecorator((key: string, ctx: ExecutionContext) => {
  const request = ctx.switchToRpc().getData();

  return key ? request.data[key] : request.data;
});
