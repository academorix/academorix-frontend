# ADR 0028 — Runtime target: Laravel Octane

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture +
Platform lead **Companion:** [ADR-0034](0034-octane-driver-swoole.md) (which
Octane driver we picked)

## Context

Stackra ships six services (see [ADR-0032](0032-six-service-split.md)) — each
one a self-contained Laravel application. The framework tier + every domain
package under `packages/backend/**` is loaded on every request. Choosing the
runtime that boots + serves these apps was the single biggest performance
knob on the table.

Baseline: **PHP-FPM**. Every request re-bootstraps the whole framework —
`bootstrap/app.php`, every `ServiceProvider::register()`, every
`ServiceProvider::boot()`, attribute discovery, route registration. On a Mac
laptop with 90 packages that's **80-120 ms of framework overhead** before the
controller runs. In production on modest hardware it flattens to 30-60 ms
per request. Doable for a small app; wasteful for six services that each
carry 40-80 packages.

Three properties we needed from the runtime:

- **Persistent workers.** Bootstrap runs once per worker process, not once per
  request. Framework overhead amortises across thousands of requests.
- **Framework awareness.** The workers understand Laravel's lifecycle —
  service providers, `Kernel::handle()`, `flushState()` between requests,
  scope resetting for `#[Scoped]` bindings.
- **Ecosystem fit.** First-party or first-party-adjacent so upgrades track
  Laravel's release cycle. No bespoke worker glue.

Four options were evaluated against these properties.

## Options considered

### Option A — PHP-FPM (baseline, rejected)

Standard PHP-FPM + nginx. One process pool per service. Framework re-boots on
every request.

**Rejected.** 30-100 ms of framework overhead per request in a monolith is
acceptable; at 90 packages per service × 6 services it's a significant tax
on every roundtrip. Attribute discovery via `olvlvl/composer-attribute-collector`
already caches the manifest, but bootstrap still walks every service provider,
merges every config, and builds the container graph from scratch per request.

Also: FPM has no lifecycle hooks — we can't hydrate boot-time registries
once and reuse them. Every discovery-driven registry (`RouteRegistrar`,
event listener discovery, cache-store registry) rebuilds on every request.

### Option B — RoadRunner without the Octane wrapper (rejected)

RoadRunner is a Go-hosted PHP worker pool. Very fast — 5-15 ms cold path per
request in production. Community binding to Laravel exists via
`spiral/roadrunner-laravel`.

**Rejected.** No native lifecycle awareness of Laravel's scope reset. Every
request would run against the worker's cached container without clearing
per-request state — every `#[Scoped]` binding would leak between requests,
every static state on a service would drift. We'd re-implement Octane's
`flushState()` + `dispatchEvent()` machinery by hand. Not worth the win over
Option D.

### Option C — FrankenPHP raw mode (rejected)

FrankenPHP is a modern Caddy-hosted PHP runtime. Worker mode is fast (2-8 ms
cold path). First-class HTTP/3 support. Very promising.

**Rejected — for now.** Two reasons:

1. **Ecosystem maturity.** FrankenPHP shipped its worker mode in late 2024.
   Laravel's own `octane:frankenphp` driver landed in Octane v2.5 (2025) but
   is still labeled experimental as of Octane 2.10. Every workspace steering
   still points at Swoole / RoadRunner as the two "supported" drivers.
2. **Operational learning curve.** No one on the team has run FrankenPHP in
   production. Adopting it means we're absorbing runtime bugs, Caddy config
   quirks, and worker-restart edge cases at the same time as we're standing
   up six services from scratch.

Revisit in 12 months. If FrankenPHP's Octane driver stabilises + team gains
operational familiarity, this ADR gets a companion superseding-note pointing
at a new ADR.

### Option D — Laravel Octane (chosen)

Laravel Octane is the official long-lived-worker wrapper for Laravel. Ships
three drivers (Swoole, RoadRunner, FrankenPHP) behind one abstraction. First-
party — tracks Laravel's release cycle. Handles lifecycle correctly:

- `RequestReceived` event fires per request.
- `RequestHandled` event fires after the response is sent.
- `RequestTerminated` event fires after `RequestHandled` — where we hook
  cleanup listeners (`CorrelationId::forget()`, Sentry scope reset).
- `flushState()` runs between requests — clears every `#[Scoped]` binding.
- `TaskReceived` / `TaskTerminated` events for background tasks (Octane's
  `Octane::concurrently()` API).

**Chosen** because it delivers all three required properties (persistent
workers + framework awareness + ecosystem fit) without asking us to write
bespoke worker glue. It also gives us optionality on the underlying driver —
today we pick Swoole (ADR-0034); if RoadRunner or FrankenPHP overtakes it
later, that's a one-line config change per service.

### Option E — Bespoke worker pool (rejected)

Roll our own Swoole / RoadRunner integration without Octane. Direct access
to the underlying worker's IPC + lifecycle.

**Rejected.** Zero ecosystem support. Every Laravel package we consume
(spatie/laravel-*, sentry/sentry-laravel, laravel/horizon) assumes Octane's
lifecycle events exist. Skipping Octane forces us to reimplement every one
of those integrations by hand.

## Decision

### D1 — Every deployed service runs on Laravel Octane

Every one of the six services (identity, commerce, notifications,
observability, academorix-api, academorix-ai) boots via `php artisan
octane:start` in production. Each service ships its own `config/octane.php`
that pins the driver + worker pool size + max-requests recycle.

The workspace scaffold already ships this: `apps/laravel-template/config/
octane.php` is the template every service inherits when stamped from
`.kiro/reports/stamp-services.py`.

### D2 — Every service is Octane-safe by construction

Every service that goes to production must run correctly under Octane. The
`.kiro/steering/octane-first-di.md` steering codifies the DI patterns that
make this true:

- Container-attribute injection (`#[Config]`, `#[Cache]`, `#[Auth]`, `#[Log]`)
  is the default access path from domain code.
- `#[Scoped]` is the default binding lifetime; `#[Singleton]` requires
  provable statelessness.
- Facades inside services are a code smell.
- Static state on services is banned.
- Third-party libraries with static state get `RequestTerminated` cleanup
  listeners.

Every reviewer runs the mental check "does this service correctly handle
request 2 after being reused from request 1?" on every PR. When the answer
is "I'd have to think about it": use `#[Scoped]`.

### D3 — Local dev uses `octane:start` too

`php artisan serve` (Laravel's built-in dev server) fresh-boots every
request. Octane-specific bugs (static state leak between requests, `#[Singleton]`
capturing per-request state) are invisible under `serve` — they only surface
in production, when it's expensive to debug them.

Every service's `composer.json` `dev` script wraps `octane:start` behind
`doppler run --`. Developers get the same worker semantics locally as
production. Cold reload happens on file save via Octane's `--watch` flag.

### D4 — CI runs the Pest suite once under `octane:test`

Testbench ships an Octane-aware test harness (`orchestra/testbench-core`
2.x). Every CI job runs the full Pest suite once under this harness in
addition to the standard run. Any test that exposes a `#[Singleton]` state
leak or a static-property drift fails in this second pass.

### D5 — RequestTerminated cleanup is mandatory for cross-request state

Any framework or third-party lib that mutates static state ships a
`RequestTerminated` listener in its `ServiceProvider::boot()`. The
`.kiro/steering/octane-first-di.md` §"Reset third-party libraries between
requests" section lists the current known ones (`CorrelationId::forget()`,
Sentry scope reset). New libraries with static state added to the workspace
land with a cleanup listener in the same commit.

### D6 — Driver selection lives in a companion ADR

Which specific Octane driver we run (Swoole vs. RoadRunner vs. FrankenPHP)
is a distinct decision from "use Octane." It's a separate ADR-0034 because:

- The driver is swappable per service — different services can use different
  drivers without an architectural change.
- The driver is likely to change over the lifetime of the platform
  (FrankenPHP will probably supersede Swoole in the next 12-18 months); the
  runtime-target decision won't.
- Splitting them keeps this ADR readable + lets a future maintainer flip
  drivers without rewriting Runtime Target.

See [ADR-0034](0034-octane-driver-swoole.md) for the Swoole choice.

## Consequences

**Positive.**

- Framework overhead amortises across the worker's lifetime. Real-world
  request p50 drops from ~50 ms (FPM) to ~5-10 ms (Octane).
- Boot-time discovery (routes, listeners, cache stores, feature-flag
  registry) runs ONCE per worker. Every downstream request reuses the
  hydrated registries — no per-request rebuild.
- Container graph builds once. Every `@Bind` / `@Singleton` / `@Scoped`
  binding is registered at worker boot; every resolution is a hash lookup.
- Lifecycle events (`RequestTerminated`, `TaskTerminated`) give us clean
  cleanup hooks for cross-request state.
- Optionality — we're behind the Octane abstraction, so we can flip drivers
  as the ecosystem evolves.

**Negative.**

- Runtime discipline is mandatory. Every service developer must think in
  Octane-safe terms: no statics, no per-request state on singletons, every
  facade is a code smell. `.kiro/steering/octane-first-di.md` is the day-to-
  day rule set; violations are silent in dev and loud in production.
- Third-party libraries need cleanup listeners for static state. Any new
  library the workspace adopts ships with a `RequestTerminated` audit in
  the same commit.
- Debugging is harder — a bug that survives `flushState()` looks like a
  correctness issue when it's actually a state-leak issue.
- Worker restart on OOM / segfault is a real thing under Swoole; the queue
  supervisor must handle it. Horizon does this correctly out of the box;
  bespoke workers would have to reinvent it.

**Neutral.**

- The 6-service split (ADR-0032) is unchanged by this ADR — Octane runs
  inside each service, not across services. Every service still has its
  own worker pool, its own DB, its own Doppler config.
- Per-package testing (`composer test` inside each package) still runs
  under `serve`-mode framework boot. The Octane-aware pass is only at the
  CI-level Pest run.

## Follow-up work

Every service already inherits the template scaffold; execution surface is
mostly done. Remaining items:

- **Per-service `config/octane.php`** — pin driver + worker count + max-
  requests per service. Landed via ADR-0034.
- **Per-service Horizon config** — worker pool + queue set. Pending
  (Sprint 2 in `tasks.md`).
- **CI Octane-test job** — the second Pest pass under Octane. Pending
  (Sprint 2 CI workflow).
- **RequestTerminated audit** — grep every `packages/backend/**` for
  static state; wire cleanup listeners where they're missing. Pending
  (Phase G verification).

## Related work

- [ADR-0032](0032-six-service-split.md) — the six-service topology this ADR
  runs inside of.
- [ADR-0034](0034-octane-driver-swoole.md) — driver selection (Swoole).
- [ADR-0022](0022-language-agnostic-service-boundary.md) — Seam 2 (inbound
  trust) has to run inside every Octane worker's request cycle.
- [`.kiro/steering/octane-first-di.md`](../../.kiro/steering/octane-first-di.md)
  — the day-to-day DI patterns that make code Octane-safe.
- [`.kiro/steering/hierarchy.md §12`](../../.kiro/steering/hierarchy.md) —
  service split anchors here.
- `apps/laravel-template/config/octane.php` — the template every service
  inherits.
