import { ClientProxy } from '@nestjs/microservices';
import { BrokenCircuitError, CircuitState, TaskCancelledError } from 'cockatiel';
import { Observable, firstValueFrom } from 'rxjs';
import { buildResiliencePolicy } from './factories/policy.factory';
import { createResilientClientProxy } from './proxies/resilience-client.proxy';
import { ResilienceOptions } from './resilience.config';

const fastOptions: ResilienceOptions = {
  timeout: { duration: 40 },
  retry: { maxAttempts: 1, initialDelay: 1, maxDelay: 1 },
  circuitBreaker: {
    threshold: 0.5,
    duration: 200,
    halfOpenAfter: 60,
    minimumSampleSize: 2,
  },
};

describe('resilience flow', () => {
  it('passes a successful ClientProxy.send response through the policy', async () => {
    const calls: string[] = [];
    const client = createResilientClientProxy(
      createFakeClient(() => {
        calls.push('send');
        return { ok: true };
      }),
      buildResiliencePolicy('TEST_SERVICE', fastOptions).policy,
    );

    await expect(firstValueFrom(client.send('pattern', { value: 1 }))).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(1);
  });

  it('retries a transient failure and returns the successful retry result', async () => {
    let calls = 0;
    const client = createResilientClientProxy(
      createFakeClient(() => {
        calls += 1;

        if (calls === 1) {
          throw new Error('temporary downstream failure');
        }

        return { recovered: true };
      }),
      buildResiliencePolicy('TEST_SERVICE', fastOptions).policy,
    );

    await expect(firstValueFrom(client.send('pattern', { value: 1 }))).resolves.toEqual({ recovered: true });
    expect(calls).toBe(2);
  });

  it('turns a slow downstream call into a timeout failure', async () => {
    const client = createResilientClientProxy(
      createFakeClient(async () => {
        await sleep(100);
        return { tooLate: true };
      }),
      buildResiliencePolicy('TEST_SERVICE', fastOptions).policy,
    );

    await expect(firstValueFrom(client.send('pattern', { value: 1 }))).rejects.toBeInstanceOf(TaskCancelledError);
  });

  it('opens the circuit after repeated failures, then prevents execution while open', async () => {
    let calls = 0;
    const { policy, circuit } = buildResiliencePolicy('TEST_SERVICE', fastOptions);
    const client = createResilientClientProxy(
      createFakeClient(() => {
        calls += 1;
        throw new Error('forced downstream failure');
      }),
      policy,
    );

    await driveCircuitOpen(client, circuit);

    expect(circuit.state).toBe(CircuitState.Open);
    const callsBeforeShortCircuit = calls;

    await expect(firstValueFrom(client.send('pattern', { attempt: 3 }))).rejects.toBeInstanceOf(BrokenCircuitError);
    expect(calls).toBe(callsBeforeShortCircuit);
  });

  it('allows a half-open trial after cooldown and closes again after success', async () => {
    let shouldFail = true;
    const { policy, circuit } = buildResiliencePolicy('TEST_SERVICE', fastOptions);
    const client = createResilientClientProxy(
      createFakeClient(() => {
        if (shouldFail) {
          throw new Error('forced downstream failure');
        }

        return { recovered: true };
      }),
      policy,
    );

    await driveCircuitOpen(client, circuit);
    expect(circuit.state).toBe(CircuitState.Open);

    shouldFail = false;
    await sleep(fastOptions.circuitBreaker.halfOpenAfter + 20);

    await expect(firstValueFrom(client.send('pattern', { attempt: 'recovery' }))).resolves.toEqual({ recovered: true });
    expect(circuit.state).toBe(CircuitState.Closed);
  });
});

function createFakeClient(handler: () => unknown | Promise<unknown>): ClientProxy {
  return {
    send: () => {
      return new Observable((subscriber) => {
        Promise.resolve()
          .then(handler)
          .then((value) => {
            subscriber.next(value);
            subscriber.complete();
          })
          .catch((error) => subscriber.error(error));
      });
    },
    emit: () => new Observable((subscriber) => subscriber.complete()),
    connect: () => Promise.resolve(),
    close: () => undefined,
  } as unknown as ClientProxy;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function driveCircuitOpen(client: ClientProxy, circuit: { state: CircuitState }) {
  for (let attempt = 1; attempt <= 5 && circuit.state !== CircuitState.Open; attempt += 1) {
    await expect(firstValueFrom(client.send('pattern', { attempt }))).rejects.toThrow();
  }
}
