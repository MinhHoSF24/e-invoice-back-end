export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
export const IDEMPOTENCY_REDIS_CLIENT = Symbol('IDEMPOTENCY_REDIS_CLIENT');

export const IDEMPOTENCY_SCOPE = {
  INVOICE_CREATE: 'invoice:create',
  INVOICE_SEND: 'invoice:send',
  STRIPE_WEBHOOK: 'stripe:webhook',
} as const;
