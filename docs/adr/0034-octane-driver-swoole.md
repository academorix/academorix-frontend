# ADR 0034 — Octane driver: Swoole

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture +
Platform lead **Parent ADR:** [ADR-0028](0028-runtime-target-laravel-octane.md)

## Context

ADR-0028 pins Laravel Octane as the runtime target for every service. Octane
ships three drivers behind one abstraction — the same `octane:start` command
runs any of them. Per-service `config/octane.php` selects which:

- **Swoole** — the original driver. C-extension. Mature, battle-tested,
  well-documented.
- **RoadRunner** — Go-hosted PHP worker pool. Also mature; different
  operational model (Go binary alongside PHP).
- **FrankenPHP** — Caddy-hosted PHP worker mode. Newest of the three;
  bundles Caddy as the HTTP server.

Each has trade-offs across five axes: raw throughput, memory usage, ecosystem
familiarity, HTTP/2/3 support, container image size, and operational maturity.
Choosing one is a per-service decision technically — but running six services
on three different drivers is a diagnostic nightmare. We picked one for the
whole workspace and pinned it in the template scaffold.

Our load profile: **long-tail transactional API**. Median request is a
CRUD-shaped read or write against Postgres, ~5-50 ms. p99 is a report query
or a Paddle webhook chain, ~200-500 ms. Peak concurrency during business
hours: ~200 rps per service. Not extreme — every driver handles it. What
matters: developer familiarity + operational maturity + Docker footprint.

## Options considered

### Option A — RoadRunner (rejected)

Go binary. `spiral/roadrunner-cli` + `laravel/octane` glue. Per-worker PHP
process managed by a Go supervisor. Excellent metrics via the RoadRunner
control plane.

**Pros.**

- Great metrics + admin surface out of the box.
- Rust-fast HTTP parsing.
- Well-understood in the Laravel ecosystem.
- Go binary is stable — very low crash rate.

**Cons.**

- Container image needs two binaries (Go + PHP). Larger image (+40 MB
  typical). Two package managers.
- Debugging a Go crash from a PHP developer's chair is harder than debugging
  a PHP crash.
- Team has no operational experience with RoadRunner. Swoole is more familiar.

**Rejected.** The team's operational familiarity is with Swoole. RoadRunner
would work fine, but the diagnostic cost of a new runtime doesn't pay back
against Swoole's baseline for our load profile.

### Option B — FrankenPHP (rejected, for now)

Caddy-hosted PHP. Worker mode shipped 2024; Laravel Octane's driver landed
in 2.5. HTTP/3 out of the box. Very promising.

**Pros.**

- Modern HTTP/3 support built in.
- Single binary (Caddy + PHP) — smallest container of the three.
- Native TLS handling — no separate reverse proxy needed for TLS termination.
- Growing momentum in the PHP community.

**Cons.**

- Ecosystem is new. Debugging tools + operational playbooks are thin.
- Octane's FrankenPHP driver is still labeled experimental as of Octane 2.10.
- Team has zero operational experience.
- Caddy config quirks add a new layer to learn.

**Rejected for now.** Revisit in 12-18 months. When FrankenPHP's Octane
driver stabilises + a team member has run it in production for 6 months, a
new ADR can supersede this one to switch drivers per service or wholesale.

### Option C — Swoole (chosen)

C-extension. Coroutine-based async I/O. The oldest of the three Octane
drivers — Octane originally shipped with Swoole as the default.

**Pros.**

- Mature. Battle-tested for 7+ years across major PHP shops.
- Single binary — the swoole PECL extension inside the PHP container.
- Team has operational experience.
- Extensive documentation + community.
- Best-performing option under Octane for CRUD workloads (Octane 2.x
  benchmarks; roughly 5-10% ahead of RoadRunner on our load profile).
- Small container footprint compared to RoadRunner (no Go binary).
- Native support for Octane's `Octane::concurrently()` API for fan-out
  workloads.

**Cons.**

- C-extension. Segfaults are harder to debug than Go crashes.
- Coroutines require careful discipline — a blocking-mode PHP call inside
  a coroutine context deadlocks the worker. Mitigated by the fact that we
  don't use coroutine mode; we use plain synchronous request handling.
- Historically shipped its own HTTP server implementation; today we still
  front with nginx / Caddy at the ingress layer, so Swoole's HTTP layer is
  only inside our VPC.
- Segfaults on OOM require worker recycling — Octane handles this
  automatically via `--max-requests`.

**Chosen.** Best fit for team familiarity + container footprint + Octane
maturity. Revisit annually.

## Decision

### D1 — Every service runs the Swoole Octane driver in production

Every service's `config/octane.php` pins:

```php
'server' => env('OCTANE_SERVER', 'swoole'),
```

Local dev + CI + production all default to Swoole. The env var is exposed for
per-environment overrides during future driver evaluations, but the default is
Swoole across every environment.

### D2 — Container images bundle the Swoole PECL extension

Every service's `docker/*.Dockerfile` installs the `swoole` extension via
PECL in a dedicated Dockerfile stage:

```dockerfile
FROM php:8.3-fpm-alpine AS swoole-build
RUN apk add --no-cache autoconf gcc g++ make openssl-dev linux-headers
RUN pecl install swoole
```

The final runtime stage copies the `swoole.so` shared object from the build
stage — keeps the runtime image small.

The Dockerfile is templated per-service; see the Sprint 2 output at
`docker/*.Dockerfile`.

### D3 — Worker pool + max-requests tuned per service

Each service's `config/octane.php` pins its own worker pool. Baseline:

- `workers => 4` in dev, 8-16 in production (per-service based on load).
- `task_workers => 2` for `Octane::concurrently()` fan-out.
- `max_requests => 500` — worker recycles after 500 requests. Mitigates
  memory-leak drift and lets `flushState()` catch anything it missed.

Every service overrides these based on its load profile. Identity + academorix-
api are the highest-concurrency services (more workers); commerce is bursty
(fewer steady workers, more task_workers for Paddle webhook fan-out).

### D4 — Coroutine mode is OFF

Swoole supports two modes: standard synchronous request handling + coroutine-
based async I/O. Coroutines are powerful but require careful discipline
(no blocking-mode PHP calls inside a coroutine context). We run in
**synchronous mode**. Coroutines can be enabled later per-service if a
specific workload warrants it (long-tail parallel fan-out); the default is
synchronous everywhere.

### D5 — Static-state audit is mandatory (see ADR-0028)

Swoole's persistent worker semantics are why ADR-0028 exists — every
`#[Singleton]` binding must be provably stateless. This ADR does not
re-litigate that discipline; it points at ADR-0028 + `.kiro/steering/octane-
first-di.md` for the day-to-day rule set.

### D6 — Driver review every 12 months

The workspace hosts a driver-review meeting once every 12 months (calendar
placed on 2027-07-21). At that meeting the team evaluates:

- FrankenPHP maturity + operational familiarity.
- Container footprint delta.
- Benchmark deltas on current load.
- Ecosystem trajectory.

If FrankenPHP or RoadRunner justifies a switch, a new ADR supersedes this
one. The review's outcome (either "stay on Swoole" or "flip to X") is
recorded either way — a "no change" outcome updates this ADR's Consequences
section with a dated note.

## Consequences

**Positive.**

- Fastest driver for our load profile per Octane 2.x benchmarks.
- Team has operational experience — incident response is faster.
- Small container image (swoole PECL extension only, no Go binary).
- Mature + well-documented.
- Octane's `concurrently()` API works out of the box.

**Negative.**

- C-extension segfaults are hard to debug from a PHP developer's chair.
  Mitigated by `--max-requests` worker recycling + Sentry integration.
- Coroutine discipline required if we ever turn coroutines on. Kept off by
  default per D4.
- Swoole is C code — a critical CVE in the extension is a rolling issue we
  track (dep-scan job in CI catches this).

**Neutral.**

- The choice is reversible. Octane's abstraction means flipping to
  RoadRunner or FrankenPHP is a one-line config change per service; the app
  code doesn't change.
- The 12-month review D6 is a lightweight commitment — no new binary
  choices, just an evaluation checkpoint.

## Follow-up work

Executed in Sprint 2 (see `tasks.md`):

- **`docker/*.Dockerfile`** — 4 shared-service Dockerfiles with swoole PECL
  installed.
- **`services/*/config/octane.php`** — per-service Octane config with pool
  size + max-requests.
- **`config/octane.php` at `apps/laravel-template/`** — already shipped
  (2026-07-21 as part of the split).
- **CI benchmark job** — measures p50/p95/p99 per service under Swoole once
  per release, so we can track drift + evaluate future driver flips.

## Related work

- [ADR-0028](0028-runtime-target-laravel-octane.md) — the parent runtime
  decision.
- [ADR-0032](0032-six-service-split.md) — the six-service topology this
  driver runs inside of.
- [`.kiro/steering/octane-first-di.md`](../../.kiro/steering/octane-first-di.md)
  — the day-to-day DI patterns that make Swoole's persistent workers safe.
- `apps/laravel-template/config/octane.php` — the template every service
  inherits.
- `docker/*.Dockerfile` — the per-service containers with the swoole PECL
  extension installed.
