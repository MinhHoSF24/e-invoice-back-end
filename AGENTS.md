<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Project Overview

This is an Nx monorepo for an e-invoice NestJS microservice system. The workspace root is this directory; if a session starts one level above, `cd my-workspace` before running project commands.

## Apps

- `bff`: HTTP/API gateway for invoice, user, authorizer, product, and Stripe webhook flows.
- `einvoice-backend`: invoice core service with invoice persistence, payment integration, and send-invoice saga orchestration.
- `authorizer`: auth/keycloak service.
- `user-access`: user and role service.
- `product`: product service.
- `media`: Cloudinary/media service.
- `pdf-generator`: invoice PDF generation service.
- `mail`: mail service, including invoice-sent event handling.
- `einvoice-backend-e2e`: end-to-end tests.

## Shared Libraries

- `configuration`: typed app, TCP, gRPC, Mongo, Redis, Kafka, Stripe, Loki, and other providers.
- `interfaces`, `schemas`, `entities`, `constants`: shared contracts and domain models.
- `resilience`: Cockatiel-based timeout, retry, circuit breaker policies, Prometheus metrics, and resilient TCP client proxy wrapping.
- `saga`: reusable saga orchestration pieces.
- `observability`: logging, metrics, and tracing support.
- `guards`, `interceptors`, `decorators`, `middlewares`, `utils`, `kafka`: common NestJS infrastructure.

## Conventions

- Prefer `pnpm nx <target> <project>` or `pnpm nx run-many ...` for build, test, lint, and serve tasks.
- Use existing `@common/*` path aliases from `tsconfig.base.json`; do not add deep relative imports across libs.
- Keep shared behavior in `libs/*`; keep app-specific controllers, services, repositories, and modules under the owning app.
- When changing inter-service messages, update both constants and shared interfaces/DTOs.
- When touching resilience or TCP client setup, check `libs/resilience` and `libs/configuration/src/lib/tcp.config.ts` together.
- TCP clients are created with `TcpProvider(...)`. Tracing is on by default; resilience is opt-in with `TcpProvider(SERVICE, { resilient: true })`, and the consuming module must import `ResilienceModule.forRoot()`.

## Session Notes

Keep this section short and current. At the end of a session, add or update one dated bullet only for durable context: architectural decisions, new modules, important commands, known gotchas, or unfinished follow-up.

- 2026-06-25: Resilience setup is active. `libs/resilience` builds shared Cockatiel policies and metrics; invoice PDF/media TCP clients are the sample resilient clients via `TcpProvider(..., { resilient: true })`.
- 2026-06-26: IdempotencyModule added; Redis provider capped at 256mb - Retry-safe writes
