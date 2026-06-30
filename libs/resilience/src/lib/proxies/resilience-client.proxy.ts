import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IPolicy } from 'cockatiel';

/**
 * Wraps a ClientProxy so every .send() goes through the resilience policy.
 * .emit() (fire-and-forget) is left alone — Kafka producer should retry itself.
 *
 * Usage: createResilientClientProxy(rawClient, policy)
 */
export function createResilientClientProxy<T extends ClientProxy>(client: T, policy: IPolicy): T {
  return new Proxy(client as any, {
    get: (target, prop) => {
      if (prop === 'send') {
        return (pattern: any, data: any): Observable<any> => {
          // We return a "deferred" Observable so the policy controls execution,
          // but the caller still gets the Observable API they expect.
          return new Observable((subscriber) => {
            policy
              .execute(() => firstValueFrom(target.send(pattern, data)))
              .then((value) => {
                subscriber.next(value);
                subscriber.complete();
              })
              .catch((err) => subscriber.error(err));
          });
        };
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
