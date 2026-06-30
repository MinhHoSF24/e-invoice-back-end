import { createHash } from 'crypto';

const VOLATILE_KEYS = new Set(['processId', 'traceparent', 'tracestate', '__tracing__']);

export function createRequestHash(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(normalize(payload)))
    .digest('hex');
}

function normalize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value as Record<string, unknown>)
    .filter((key) => !VOLATILE_KEYS.has(key))
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = normalize((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}
