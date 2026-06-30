import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestParams = createParamDecorator((key: string, ctx: ExecutionContext) => {
  const request = ctx.switchToRpc().getData();
  const data = request?.data?.data ?? request;

  return key ? data?.data?.[key] : data;
});
