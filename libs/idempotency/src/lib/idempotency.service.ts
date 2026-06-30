import { ConflictException, Injectable } from '@nestjs/common';
import { IdempotencyRedisRepository } from './repositories/idempotency-redis.repository';
import { IdempotencyClaimOutcome, IdempotencyRunOptions } from './idempotency.types';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOCK_MS = 60 * 1000;

@Injectable()
export class IdempotencyService {
  constructor(private readonly repository: IdempotencyRedisRepository) {}

  async run<T>(options: IdempotencyRunOptions, handler: () => Promise<T>): Promise<T> {
    this.validateOptions(options);

    const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    const lockMs = options.lockMs ?? DEFAULT_LOCK_MS;
    const claim = await this.repository.claim({ ...options, ttlMs, lockMs });

    switch (claim.outcome) {
      case IdempotencyClaimOutcome.CLAIMED:
        return this.executeClaimed(options, ttlMs, handler);
      case IdempotencyClaimOutcome.COMPLETED:
        return claim.record?.response as T;
      case IdempotencyClaimOutcome.HASH_MISMATCH:
        throw new ConflictException('Idempotency key was already used with a different request payload');
      case IdempotencyClaimOutcome.FAILED:
        throw new ConflictException(claim.record?.error || 'Idempotent operation already failed');
      case IdempotencyClaimOutcome.IN_PROGRESS:
      default:
        throw new ConflictException('Idempotent operation is already in progress');
    }
  }

  private async executeClaimed<T>(
    options: IdempotencyRunOptions,
    ttlMs: number,
    handler: () => Promise<T>,
  ): Promise<T> {
    try {
      const response = await handler();
      await this.repository.complete(options.scope, options.key, response, ttlMs);
      return response;
    } catch (error: any) {
      if (options.cacheFailures) {
        await this.repository.fail(options.scope, options.key, error?.message || 'Operation failed', ttlMs);
      } else {
        await this.repository.release(options.scope, options.key);
      }

      throw error;
    }
  }

  private validateOptions(options: IdempotencyRunOptions): void {
    if (!options.scope || !options.key || !options.requestHash) {
      throw new ConflictException('Missing idempotency scope, key, or request hash');
    }
  }
}
