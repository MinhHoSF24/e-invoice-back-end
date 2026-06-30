import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IDEMPOTENCY_KEY_HEADER } from '../idempotency.constants';

export const IdempotencyKey = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
  const value = request.headers[IDEMPOTENCY_KEY_HEADER];

  return Array.isArray(value) ? value[0] : value;
});
