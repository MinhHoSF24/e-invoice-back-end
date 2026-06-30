import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from '@keyv/redis';
import { IDEMPOTENCY_REDIS_CLIENT } from '../idempotency.constants';
import {
  IdempotencyClaimOutcome,
  IdempotencyClaimResult,
  IdempotencyRecord,
  IdempotencyStatus,
} from '../idempotency.types';

const CLAIM_SCRIPT = `
local current = redis.call('GET', KEYS[1])

if not current then
  redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[4])
  return cjson.encode({ outcome = 'CLAIMED' })
end

local decoded = cjson.decode(current)

if decoded.requestHash ~= ARGV[2] then
  return cjson.encode({ outcome = 'HASH_MISMATCH', record = decoded })
end

if decoded.status == 'COMPLETED' then
  return cjson.encode({ outcome = 'COMPLETED', record = decoded })
end

if decoded.status == 'FAILED' then
  return cjson.encode({ outcome = 'FAILED', record = decoded })
end

if decoded.lockedUntil and tonumber(decoded.lockedUntil) > tonumber(ARGV[3]) then
  return cjson.encode({ outcome = 'IN_PROGRESS', record = decoded })
end

redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[4])
return cjson.encode({ outcome = 'CLAIMED' })
`;

@Injectable()
export class IdempotencyRedisRepository {
  constructor(@Inject(IDEMPOTENCY_REDIS_CLIENT) private readonly redis: RedisClientType) {}

  async claim(params: {
    scope: string;
    key: string;
    requestHash: string;
    ttlMs: number;
    lockMs: number;
  }): Promise<IdempotencyClaimResult> {
    const now = Date.now();
    const record: IdempotencyRecord = {
      key: params.key,
      scope: params.scope,
      requestHash: params.requestHash,
      status: IdempotencyStatus.IN_PROGRESS,
      lockedUntil: now + params.lockMs,
      createdAt: now,
      updatedAt: now,
    };

    const raw = await this.redis.eval(CLAIM_SCRIPT, {
      keys: [this.redisKey(params.scope, params.key)],
      arguments: [JSON.stringify(record), params.requestHash, String(now), String(params.ttlMs)],
    });

    return this.parseClaimResult(raw);
  }

  async find<T>(scope: string, key: string): Promise<IdempotencyRecord<T> | undefined> {
    const raw = await this.redis.get(this.redisKey(scope, key));
    return typeof raw === 'string' ? (JSON.parse(raw) as IdempotencyRecord<T>) : undefined;
  }

  async complete<T>(scope: string, key: string, response: T, ttlMs: number): Promise<void> {
    const current = await this.find(scope, key);
    if (!current) {
      return;
    }

    await this.redis.set(
      this.redisKey(scope, key),
      JSON.stringify({
        ...current,
        status: IdempotencyStatus.COMPLETED,
        response,
        error: undefined,
        lockedUntil: undefined,
        updatedAt: Date.now(),
      }),
      { expiration: { type: 'PX', value: ttlMs }, condition: 'XX' },
    );
  }

  async fail(scope: string, key: string, error: string, ttlMs: number): Promise<void> {
    const current = await this.find(scope, key);
    if (!current) {
      return;
    }

    await this.redis.set(
      this.redisKey(scope, key),
      JSON.stringify({
        ...current,
        status: IdempotencyStatus.FAILED,
        error,
        lockedUntil: undefined,
        updatedAt: Date.now(),
      }),
      { expiration: { type: 'PX', value: ttlMs }, condition: 'XX' },
    );
  }

  release(scope: string, key: string): Promise<number> {
    return this.redis.del(this.redisKey(scope, key));
  }

  private redisKey(scope: string, key: string): string {
    return `idempotency:${scope}:${key}`;
  }

  private parseClaimResult(raw: unknown): IdempotencyClaimResult {
    if (typeof raw !== 'string') {
      return { outcome: IdempotencyClaimOutcome.IN_PROGRESS };
    }

    const parsed = JSON.parse(raw) as IdempotencyClaimResult;
    return parsed;
  }
}
