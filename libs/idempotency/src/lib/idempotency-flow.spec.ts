import { ConflictException } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyClaimOutcome, IdempotencyRunOptions, IdempotencyStatus } from './idempotency.types';
import { IdempotencyRedisRepository } from './repositories/idempotency-redis.repository';

describe('idempotency flow', () => {
  const baseOptions: IdempotencyRunOptions = {
    scope: 'invoice:create',
    key: 'invoice-create-test-001',
    requestHash: 'request-hash-001',
    ttlMs: 1_000,
    lockMs: 500,
  };

  it('claims a new key, executes the handler, caches the response, and returns it', async () => {
    const repository = createRepositoryMock();
    repository.claim.mockResolvedValue({ outcome: IdempotencyClaimOutcome.CLAIMED });
    const service = new IdempotencyService(repository);
    const response = { invoiceId: 'invoice-001' };
    const handler = jest.fn().mockResolvedValue(response);

    await expect(service.run(baseOptions, handler)).resolves.toEqual(response);

    expect(repository.claim).toHaveBeenCalledWith(baseOptions);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(repository.complete).toHaveBeenCalledWith(baseOptions.scope, baseOptions.key, response, baseOptions.ttlMs);
    expect(repository.release).not.toHaveBeenCalled();
    expect(repository.fail).not.toHaveBeenCalled();
  });

  it('returns the cached response when the same key and same payload were already completed', async () => {
    const repository = createRepositoryMock();
    const cachedResponse = { invoiceId: 'invoice-001' };
    repository.claim.mockResolvedValue({
      outcome: IdempotencyClaimOutcome.COMPLETED,
      record: {
        ...baseOptions,
        status: IdempotencyStatus.COMPLETED,
        response: cachedResponse,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    const service = new IdempotencyService(repository);
    const handler = jest.fn();

    await expect(service.run(baseOptions, handler)).resolves.toEqual(cachedResponse);

    expect(handler).not.toHaveBeenCalled();
    expect(repository.complete).not.toHaveBeenCalled();
  });

  it('rejects when the same key is reused with a different request hash', async () => {
    const repository = createRepositoryMock();
    repository.claim.mockResolvedValue({ outcome: IdempotencyClaimOutcome.HASH_MISMATCH });
    const service = new IdempotencyService(repository);

    await expect(service.run(baseOptions, jest.fn())).rejects.toThrow(
      'Idempotency key was already used with a different request payload',
    );
  });

  it('rejects when the same operation is still in progress', async () => {
    const repository = createRepositoryMock();
    repository.claim.mockResolvedValue({ outcome: IdempotencyClaimOutcome.IN_PROGRESS });
    const service = new IdempotencyService(repository);

    await expect(service.run(baseOptions, jest.fn())).rejects.toThrow('Idempotent operation is already in progress');
  });

  it('rejects with the cached error when a previous failure was cached', async () => {
    const repository = createRepositoryMock();
    repository.claim.mockResolvedValue({
      outcome: IdempotencyClaimOutcome.FAILED,
      record: {
        ...baseOptions,
        status: IdempotencyStatus.FAILED,
        error: 'Payment provider rejected the request',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    const service = new IdempotencyService(repository);

    await expect(service.run(baseOptions, jest.fn())).rejects.toThrow('Payment provider rejected the request');
  });

  it('releases the key when the handler fails and cacheFailures is disabled', async () => {
    const repository = createRepositoryMock();
    repository.claim.mockResolvedValue({ outcome: IdempotencyClaimOutcome.CLAIMED });
    const service = new IdempotencyService(repository);
    const error = new Error('temporary downstream failure');

    await expect(service.run(baseOptions, jest.fn().mockRejectedValue(error))).rejects.toThrow(error.message);

    expect(repository.release).toHaveBeenCalledWith(baseOptions.scope, baseOptions.key);
    expect(repository.fail).not.toHaveBeenCalled();
  });

  it('caches the failure when the handler fails and cacheFailures is enabled', async () => {
    const repository = createRepositoryMock();
    repository.claim.mockResolvedValue({ outcome: IdempotencyClaimOutcome.CLAIMED });
    const service = new IdempotencyService(repository);
    const error = new Error('permanent business failure');

    await expect(
      service.run({ ...baseOptions, cacheFailures: true }, jest.fn().mockRejectedValue(error)),
    ).rejects.toThrow(error.message);

    expect(repository.fail).toHaveBeenCalledWith(baseOptions.scope, baseOptions.key, error.message, baseOptions.ttlMs);
    expect(repository.release).not.toHaveBeenCalled();
  });

  it('rejects when scope, key, or request hash is missing', async () => {
    const repository = createRepositoryMock();
    const service = new IdempotencyService(repository);

    await expect(service.run({ ...baseOptions, key: '' }, jest.fn())).rejects.toBeInstanceOf(ConflictException);
    expect(repository.claim).not.toHaveBeenCalled();
  });
});

function createRepositoryMock() {
  return {
    claim: jest.fn(),
    complete: jest.fn(),
    fail: jest.fn(),
    release: jest.fn(),
  } as unknown as jest.Mocked<IdempotencyRedisRepository>;
}
