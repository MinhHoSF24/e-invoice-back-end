import { Inject, Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerPolicy, IPolicy, noop } from 'cockatiel';
import { buildResiliencePolicy } from './factories/policy.factory';
import { registerCircuitBreakerMetrics } from './metrics/circuit-breaker.metrics';
import { RESILIENCE_OPTIONS } from './resilience.constants';
import { DEFAULT_RESILIENCE_OPTIONS, ResilienceOptionsMap } from './resilience.config';

export interface BuiltResiliencePolicy {
  policy: IPolicy;
  circuit: CircuitBreakerPolicy;
}

@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);
  private readonly policies = new Map<string, BuiltResiliencePolicy>();

  constructor(
    @Inject(RESILIENCE_OPTIONS)
    private readonly options: ResilienceOptionsMap = DEFAULT_RESILIENCE_OPTIONS,
  ) {
    Object.entries(this.options).forEach(([serviceName, serviceOptions]) => {
      this.setPolicy(serviceName, buildResiliencePolicy(serviceName, serviceOptions));
    });
  }

  getPolicy(serviceName: string): IPolicy {
    const entry = this.policies.get(serviceName);

    if (!entry) {
      this.logger.warn(`No resilience policy for ${serviceName}, using no-op policy`);
      return noop;
    }

    return entry.policy;
  }

  private setPolicy(serviceName: string, built: BuiltResiliencePolicy) {
    this.policies.set(serviceName, built);
    registerCircuitBreakerMetrics(serviceName, built.circuit);
  }
}
