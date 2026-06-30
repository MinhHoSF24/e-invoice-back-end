# Resilience

Shared NestJS resilience utilities for outbound service calls.

Current behavior:

- Timeout per downstream attempt
- Retry with exponential backoff
- Circuit breaker per service
- Prometheus circuit breaker metrics
- Resilient `ClientProxy.send()` wrapper

## Automated Flow Test

Run:

```sh
pnpm nx test resilience
```

This test uses a fake Nest `ClientProxy` and the real Cockatiel policy chain.

Covered flows:

1. Successful downstream response passes through.
2. Temporary downstream failure is retried and then succeeds.
3. Slow downstream response fails with `TaskCancelledError`.
4. Repeated downstream failures open the circuit.
5. While open, the circuit prevents execution with `BrokenCircuitError`.
6. After `halfOpenAfter`, a successful trial closes the circuit again.

Expected test result:

```txt
Test Suites: 1 passed
Tests:       5 passed
```

## Manual Local Flow

Start the services used by the current sample:

```sh
pnpm dev:lite bff invoice authorizer user-access
```

This starts:

- `bff`
- `einvoice-backend`
- `pdf-generator`
- `media`
- `authorizer`
- `user-access`

Open Swagger:

```txt
http://localhost:3300/api/v1/docs
```

Metrics:

```txt
http://localhost:3001/api/v1/metrics
```

Current resilient calls:

- `einvoice-backend -> TCP_PDF_GENERATOR_SERVICE`
- `einvoice-backend -> TCP_MEDIA_SERVICE`

## Manual Circuit Breaker Test

Use `TCP_PDF_GENERATOR_SERVICE` because invoice send calls PDF generation first.

### 1. Use Fast Local Config

For local testing, temporarily keep PDF resilience config small:

```ts
TCP_PDF_GENERATOR_SERVICE: {
  timeout: { duration: 1_000 },
  retry: { maxAttempts: 1, initialDelay: 100, maxDelay: 300 },
  circuitBreaker: {
    threshold: 0.5,
    duration: 5_000,
    halfOpenAfter: 3_000,
    minimumSampleSize: 2,
  },
}
```

### 2. Force PDF Failure

Temporarily throw from:

```txt
apps/pdf-generator/src/app/modules/invoice/controllers/invoice-pdf.controller.ts
```

```ts
throw new Error('forced pdf failure for circuit breaker test');
```

### 3. Trigger Invoice Send

In Swagger, call:

```txt
POST /api/v1/invoice/{id}/send
```

Required headers:

```txt
Authorization: Bearer <token>
Idempotency-Key: invoice-send-cb-test-001
```

Use a new `Idempotency-Key` for each manual attempt:

```txt
invoice-send-cb-test-001
invoice-send-cb-test-002
invoice-send-cb-test-003
```

### 4. Expected Failure Before Circuit Opens

Expected:

- BFF forwards request to `einvoice-backend`.
- `einvoice-backend` starts invoice send saga.
- Saga calls `pdf-generator`.
- PDF service throws.
- Retry policy retries according to config.
- Final error returns to saga.
- Circuit records failure.

### 5. Expected Circuit Open

After enough failed executions, expected:

```txt
Execution prevented because the circuit breaker is open
```

This is Cockatiel's `BrokenCircuitError` message.

Expected behavior:

- Request fails fast.
- `pdf-generator` does not receive a new request.
- Circuit state is `open`.

Check metrics:

```sh
curl http://localhost:3001/api/v1/metrics
```

PowerShell:

```powershell
(Invoke-WebRequest http://localhost:3001/api/v1/metrics).Content |
  Select-String "resilience"
```

Expected metric:

```txt
resilience_circuit_breaker_state{service="TCP_PDF_GENERATOR_SERVICE",state="open"} 1
```

### 6. Expected Half-Open Recovery

Remove the forced PDF error.

Wait longer than:

```ts
halfOpenAfter;
```

Then send another request with a new key:

```txt
Idempotency-Key: invoice-send-cb-test-recovery-001
```

Expected:

- Circuit allows a trial call.
- PDF succeeds.
- Circuit state returns to `closed`.

Expected metric:

```txt
resilience_circuit_breaker_state{service="TCP_PDF_GENERATOR_SERVICE",state="closed"} 1
```

## Important Note

`minimumSampleSize` is converted to Cockatiel `minimumRps` for `SamplingBreaker`.

That means it is not an exact "wait for N HTTP requests" counter. Under fast local failures, the circuit can open sooner than expected. For production tuning, validate behavior with realistic traffic and latency.
