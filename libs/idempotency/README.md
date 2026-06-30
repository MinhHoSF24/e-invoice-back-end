# Idempotency

Shared idempotency utilities for protecting retryable HTTP/TCP flows from duplicate side effects.

Current usage:

- BFF requires `Idempotency-Key` on invoice create and invoice send.
- BFF sends `{ key, scope, requestHash }` to `einvoice-backend`.
- `einvoice-backend` uses `IdempotencyService.run(...)`.
- Redis stores the in-progress/completed/failed idempotency record.

## Automated Flow Test

Run:

```sh
pnpm nx test idempotency
```

Covered flows:

1. New key is claimed, handler executes, response is cached.
2. Same key + same request hash returns cached response.
3. Same key + different request hash returns conflict.
4. Same key while first operation is in progress returns conflict.
5. Cached failed operation returns cached error.
6. Handler failure releases the key by default, allowing retry.
7. Handler failure is cached when `cacheFailures: true`.
8. Missing scope/key/hash is rejected before touching Redis.

Expected test result:

```txt
Test Suites: 1 passed
Tests:       8 passed
```

## Manual Swagger Flow

Start services:

```sh
pnpm dev:lite bff invoice authorizer user-access
```

Open Swagger:

```txt
http://localhost:3300/api/v1/docs
```

### Invoice Create

Endpoint:

```txt
POST /api/v1/invoice
```

Required header:

```txt
Idempotency-Key: invoice-create-test-001
```

Expected outcomes:

- First request creates the invoice.
- Same key + same body returns the cached response.
- Same key + different body returns `409 Conflict`.
- Missing key returns `400 Bad Request`.

### Invoice Send

Endpoint:

```txt
POST /api/v1/invoice/{id}/send
```

Required header:

```txt
Idempotency-Key: invoice-send-test-001
```

Expected outcomes:

- First request starts the send flow.
- Same key + same `{ invoiceId, userId }` returns cached response.
- Same key + different payload returns `409 Conflict`.

Use a different idempotency key for different business operations.
