---
inclusion: fileMatch
fileMatchPattern: "**/{Http,Console,Services,Repositories,Actions}/**/*.php"
---

# Scope platform — rules of engagement

Every HTTP-visible surface, every console command that touches tenant data,
every repository read, and every action MUST operate under an active scope
context. This file pins the rules that keep the contract intact across every
module.

## What "scope" is

`stackra/scope` is the framework-tier hierarchical scope platform. Four
tables (`scope_definitions`, `scope_nodes`, `scope_values`, `scope_aliases`),
one resolver chain, N consumer namespaces. See
`packages/framework/scope/README.md` for the full model.

Every module that owns configuration (settings, permissions, feature flags,
pricing, notifications preferences, ...) registers a namespace with
`ScopeRegistryInterface::consumer(...)` and stores its values through the
resolver — never with a bespoke table.

## The hard rules

### 1. Middleware coverage

Every `/api/v1/...` route MUST include the `scope` middleware group. The
`LoadsRoutes` concern applies the group by default; do not opt out without a
`#[BypassScope]` justification on every affected action.

### 2. `Scope::current()` in reads

Any read that varies by scope calls `Scope::current()` (nullable) or
`Scope::currentOrFail()` (throws). Both go through the facade — NEVER inject
`ScopeContext` into deeply-nested services just to read the current node.
Facades ARE fine here because the context is request-scoped, not global state.

### 3. `#[ScopedTo]` on tenant-owned models

Any Eloquent model whose table carries a `scope_node_id` column MUST carry
`#[ScopedTo]`. The auto-scope global scope enforces ancestor-chain filtering on
every query.

### 4. `#[BypassScope]` for every cross-scope read

Explicit + reviewable. Every method that legitimately reads across scopes (audit
reports, GDPR erasure, support impersonation) carries
`#[BypassScope(reason: '<explanation>', adrRef: 'ADR-XXXX')]` AND calls
`withoutGlobalScope(ScopedGlobalScope::class)` inside. Both are required — the
attribute is the "why", the method call is the "how". Missing either is a
review-blocking finding.

### 5. Consumer namespaces

Every namespace MUST be lowercase, alphanumeric + underscores, starting with a
letter, 1-64 chars. The registry enforces this with a regex; the steering
enforces the semantics: pick a descriptive slug (`settings`, `feature_flags`,
`pricing`), not a generic one (`config`, `values`).

### 6. Facade over service injection

Prefer `Scope::current()` / `Scope::resolve(...)` at call sites. Only inject
`ScopeContextInterface` or `ScopeResolutionInterface` directly into a class when
the class is being unit-tested and the facade root is being swapped for a mock.
The facade IS resolvable in tests via `Scope::swap($fake)`.

### 7. Background jobs capture context at dispatch

Any queued job whose behaviour depends on scope MUST capture the active
`ScopeContextData` at dispatch time and re-establish it via
`ScopeEmulator::runIn(...)` when the job runs. Dispatching without the capture
reads NO context on the worker side and fails the strict middleware check.

```php
// Dispatch
$context = Scope::currentOrFail();
DispatchInvoiceEmailJob::dispatch($invoiceId, $context);

// Handle
public function handle(ScopeEmulatorInterface $emulator): void
{
    $emulator->runIn($this->context, function (): void {
        // job body — reads see the same scope the dispatcher had
    });
}
```

### 8. Console commands opt-in explicitly

Console commands do NOT get the `scope` middleware — they run outside the HTTP
request. A command that touches tenant data either:

- Accepts a `--scope-node-id=<uuid>` option and calls `Scope::runInNode(...)`
  before doing work, OR
- Iterates every owner's root and does the work per-scope (typical for cron
  jobs), OR
- Carries `#[BypassScope]` on `handle()` and explicitly documents the rationale.

## Anti-patterns

- ❌ Reading `Scope::current()` from a model event listener without first
  confirming the model is loaded inside a middleware-wrapped request. Model
  events fire during seeding + factory calls where no context exists.
- ❌ Writing to `scope_values` directly through Eloquent. Every write goes
  through `Scope::write(...)` or the resolver's `write()` method so the
  consumer's validator runs.
- ❌ Introducing a new hierarchy level in code (a hardcoded "team" concept). New
  levels are `scope_definitions` rows, seeded per deployment.
- ❌ Using `session()` for scope state. Session state doesn't work with Sanctum
  PATs and doesn't survive queue workers.

## Related steering

- `package-architecture.md` — the layered pattern scope consumers follow when
  they wrap resolver reads in their own service.
- `octane-first-di.md` — why the context is `#[Scoped]` and why the emulator
  uses push/pop over static state.
- `conventions.md` — docblocks + strict types + explicit return types apply to
  every file in this package too.
