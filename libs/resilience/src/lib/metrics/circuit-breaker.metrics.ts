import { CircuitBreakerPolicy, CircuitState } from 'cockatiel';
import { Counter, Gauge, register } from 'prom-client';

type StateLabel = 'service' | 'state';
type ResultLabel = 'service' | 'result';

const registeredCircuits = new WeakSet<CircuitBreakerPolicy>();

const stateGauge = getOrCreateGauge<StateLabel>(
  'resilience_circuit_breaker_state',
  'Circuit breaker state by service: 0=closed, 1=open, 2=half_open, 3=isolated.',
  ['service', 'state'],
);

const transitionCounter = getOrCreateCounter<StateLabel>(
  'resilience_circuit_breaker_transitions_total',
  'Total circuit breaker state transitions by service.',
  ['service', 'state'],
);

const executionCounter = getOrCreateCounter<ResultLabel>(
  'resilience_policy_executions_total',
  'Total resilience policy executions by service and result.',
  ['service', 'result'],
);

export function registerCircuitBreakerMetrics(serviceName: string, circuit: CircuitBreakerPolicy) {
  if (registeredCircuits.has(circuit)) {
    return;
  }

  registeredCircuits.add(circuit);
  recordState(serviceName, circuit.state);

  circuit.onStateChange((state) => {
    recordState(serviceName, state);
    transitionCounter.inc({ service: serviceName, state: stateLabel(state) });
  });

  circuit.onSuccess(() => executionCounter.inc({ service: serviceName, result: 'success' }));
  circuit.onFailure(() => executionCounter.inc({ service: serviceName, result: 'failure' }));
}

function recordState(serviceName: string, currentState: CircuitState) {
  Object.values(CircuitState)
    .filter((value): value is CircuitState => typeof value === 'number')
    .forEach((state) => {
      stateGauge.set({ service: serviceName, state: stateLabel(state) }, state === currentState ? 1 : 0);
    });
}

function stateLabel(state: CircuitState) {
  return CircuitState[state].replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

function getOrCreateCounter<T extends string>(name: string, help: string, labelNames: T[]): Counter<T> {
  return (register.getSingleMetric(name) as Counter<T> | undefined) ?? new Counter<T>({ name, help, labelNames });
}

function getOrCreateGauge<T extends string>(name: string, help: string, labelNames: T[]): Gauge<T> {
  return (register.getSingleMetric(name) as Gauge<T> | undefined) ?? new Gauge<T>({ name, help, labelNames });
}
