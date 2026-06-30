import {
  CircuitBreakerPolicy,
  ExponentialBackoff,
  IPolicy,
  SamplingBreaker,
  TimeoutStrategy,
  circuitBreaker,
  handleAll,
  retry,
  timeout,
  wrap,
} from 'cockatiel';
import { ResilienceOptions } from '../resilience.config';

/**
 * Builds a composed cockatiel policy:
 * CircuitBreaker(Retry(Timeout(execution)))
 *
 * The circuit breaker is shared per service and wraps the entire call.
 * Retry wraps timeout so each retry attempt gets its own timeout budget.
 */
export function buildResiliencePolicy(
  _serviceName: string,
  options: ResilienceOptions,
): { policy: IPolicy; circuit: CircuitBreakerPolicy } {
  const timeoutPolicy = timeout(options.timeout.duration, TimeoutStrategy.Aggressive);

  const retryPolicy = retry(handleAll, {
    maxAttempts: options.retry.maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: options.retry.initialDelay,
      maxDelay: options.retry.maxDelay,
    }),
  });

  const circuitPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: options.circuitBreaker.halfOpenAfter,
    breaker: new SamplingBreaker({
      threshold: options.circuitBreaker.threshold,
      duration: options.circuitBreaker.duration,
      minimumRps: getMinimumRps(options),
    }),
  });

  const composed = wrap(circuitPolicy, retryPolicy, timeoutPolicy);

  return { policy: composed, circuit: circuitPolicy };
}

function getMinimumRps(options: ResilienceOptions) {
  const minimumSampleSize = options.circuitBreaker.minimumSampleSize;

  if (!minimumSampleSize) {
    return undefined;
  }

  return minimumSampleSize / Math.max(options.circuitBreaker.duration / 1000, 1);
}
