export enum IdempotencyStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum IdempotencyClaimOutcome {
  CLAIMED = 'CLAIMED',
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  HASH_MISMATCH = 'HASH_MISMATCH',
}

export interface IdempotencyContext {
  key: string;
  scope: string;
  requestHash: string;
}

export interface IdempotencyRecord<T = unknown> extends IdempotencyContext {
  status: IdempotencyStatus;
  response?: T;
  error?: string;
  lockedUntil?: number;
  createdAt: number;
  updatedAt: number;
}

export interface IdempotencyRunOptions {
  scope: string;
  key: string;
  requestHash: string;
  ttlMs?: number;
  lockMs?: number;
  cacheFailures?: boolean;
}

export interface IdempotencyClaimResult<T = unknown> {
  outcome: IdempotencyClaimOutcome;
  record?: IdempotencyRecord<T>;
}
