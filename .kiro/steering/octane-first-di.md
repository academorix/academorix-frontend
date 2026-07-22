---
inclusion: fileMatch
fileMatchPattern: "**/*.php"
---

# Octane-first dependency injection

> **ADR anchor.** This steering codifies
> [ADR-0028](../../docs/adr/0028-runtime-target-laravel-octane.md) — Runtime
> target: Laravel Octane; every service is Octane-safe by construction. The
> "when in doubt, `#[Scoped]`" rule below is the invariant that ADR pins. Driver
> selection (Swoole today) lives in
> [ADR-0034](../../docs/adr/0034-octane-driver-swoole.md).

Every Stackra backend app targets Laravel Octane in production (Roadrunner or
Swoole worker pool). Octane keeps the framework + the container **alive between
requests** in the same PHP process. Any service, closure, or static that
captured request-1 state and got promoted to a singleton will silently serve
request-2 the wrong data. Debugging that class of bug in production is
nightmarish.

This steering codifies the DI patterns that make code Octane-safe by
construction. Every service the agent writes must follow these rules; the review
pass must reject anything that violates them.

## Precedence

1. This file wins over any "just make it a singleton" guidance.
2. Container-attribute injection (`#[Config]`, `#[Cache]`, `#[Auth]`, ...) is
   the DEFAULT for accessing framework services from within domain code. Direct
   facade use is a code smell in a service.
3. When in doubt, prefer `#[Scoped]` over `#[Singleton]` — scoped bindings reset
   between requests automatically, singletons do not.

## The three container lifetimes

Laravel's container has three registration flavours. Under Octane each behaves
differently:

| Attribute                  | Lifetime                                                   | Persists across requests?        | Safe for state?              |
| -------------------------- | ---------------------------------------------------------- | -------------------------------- | ---------------------------- |
| `#[Bind(Concrete::class)]` | Transient — new instance per resolution                    | no                               | yes (stateless holders only) |
| `#[Scoped]`                | Once per resolution scope (i.e., per request under Octane) | no (reset on `flushState`)       | yes for per-request state    |
| `#[Singleton]`             | Once per worker process                                    | **YES — survives every request** | no — must be stateless       |

Rule of thumb: **default to `#[Bind]` or `#[Scoped]`. Only reach for
`#[Singleton]` when the service is provably stateless AND construction cost
matters.**

## Rules — do

### 1. Prefer constructor injection + container attributes

Every framework service the class needs arrives via constructor + attribute. The
container resolves at every `->make()` call.

```php
final class InvoiceReporter
{
    public function __construct(
        #[Log('billing')] private readonly LoggerInterface $log,
        #[Cache('redis')] private readonly Repository $cache,
        #[Config('billing.reporting.batch_size')] private readonly int $batchSize,
        #[DB('reporting')] private readonly Connection $db,
        private readonly Clock $clock,
    ) {}
}
```

Every attribute-injected dependency is resolved by the container per-request
when the CLASS ITSELF is scoped or transient. That keeps per-request state on
the framework side instead of leaking through our services.

### 2. Use `#[Scoped]` for anything that touches the current request

Anything that reads `request()`, current user, current tenant, correlation id,
current locale — mark the class `#[Scoped]`:

```php
#[Scoped]
#[Bind(TenantContext::class)]
final class TenantContextResolver implements TenantContext
{
    public function __construct(
        #[CurrentUser] private readonly User $user,
        #[RouteParameter('tenant')] private readonly string $tenantId,
    ) {}

    public function currentTenantId(): string
    {
        return $this->tenantId;
    }
}
```

Under Octane, `TenantContextResolver` is created once per request, and Laravel's
`flushState()` (called between requests) discards it along with the resolved
parameters. Next request gets a fresh instance for its own request state.

### 3. `#[Singleton]` only when provably stateless

The class holds NO mutable state, holds NO references to per-request services,
and construction is expensive enough to matter.

Good candidates:

- Deterministic mappers (like our `ExceptionMapper` — pure function from
  throwable to Stackra exception).
- Value-lookup tables built once at boot.
- Cache-adapter wrappers (the adapter is stateless; the backing store is not).
- Stateless computation helpers.

Bad candidates (never singleton):

- Anything that reads the current user, tenant, or request.
- Anything that holds an open transaction, cursor, or file handle.
- Anything that caches a value scoped to a request.
- Any HTTP client that pins headers per request (auth token, tenant header,
  correlation id).

If in doubt, `#[Scoped]`. Never `#[Singleton]` speculatively.

### 4. Reset third-party libraries between requests

Third-party libraries that hold static state must be reset in an Octane
`RequestTerminated` (or `RequestReceived`) listener. Foundation ships listeners
for the libraries we know about:

- `CorrelationId::forget()` — cleared after every request (already wired in
  `FoundationServiceProvider`).
- Static `Str::random()` seeds — cleared by Laravel core.
- Sentry scope — cleared by Sentry SDK's Octane integration.

When you introduce a new library that mutates static state, register a cleanup
listener in the package provider's `bootBespoke()`:

```php
Octane::listener(RequestTerminated::class, static function (): void {
    MyLib::resetGlobalState();
});
```

### 5. Reset Eloquent model events + custom state

If a service registers Eloquent event listeners (`saving`, `updating`,
`retrieved`), it MUST also register a `RequestTerminated` listener to unregister
them. Otherwise every request stacks another listener on top and memory /
event-fanout grows unbounded.

Prefer `#[ObservedBy]` on the model over `Model::saving(function () { ... })` in
a service. Observers are registered once (at model boot) and stay static.

### 6. Reset request-scoped container instances

The Octane worker calls `app()->flush()` between requests. Any singleton that
captured a `Request`, `Response`, or `AuthManager` reference at boot is now
serving stale objects. Never do:

```php
final class BadService
{
    // ❌ Captures the boot-time Request — stale on request 2.
    public function __construct(private readonly Request $request) {}
}
```

Do instead:

```php
final class GoodService
{
    // ✅ #[Scoped] means "recreate per request".
    public function __construct(
        #[RouteParameter('id')] private readonly string $id,
    ) {}
}
```

...and register `GoodService` with `#[Scoped]` so `$id` is freshly resolved per
request.

## Rules — don't

### 1. No static state on services

Static properties survive requests. If a service caches to a static property,
every request after the first serves stale data:

```php
// ❌ NEVER — static state leaks between requests
final class TenantCache
{
    private static array $lookup = [];

    public function get(string $key): ?Tenant
    {
        return self::$lookup[$key] ??= Tenant::query()->find($key);
    }
}
```

If you genuinely need process-lifetime caching, use Laravel's cache system with
an `array` driver bound to `#[Scoped]` (or `redis` for cross-worker):

```php
// ✅ Cache is a per-request service; the underlying store handles
//    lifetimes correctly.
#[Scoped]
final class TenantCache
{
    public function __construct(
        #[Cache('array')] private readonly Repository $memo,
    ) {}

    public function get(string $key): ?Tenant
    {
        return $this->memo->rememberForever(
            "tenant:{$key}",
            fn () => Tenant::query()->find($key),
        );
    }
}
```

### 2. No facades inside services

`Auth::user()`, `Log::info(...)`, `Cache::store('redis')` — these proxy to the
container each call, which usually works but ties the service to the current
request scope invisibly. Under Octane the proxy resolves against the
current-request container, but the service instance is shared across requests,
which creates non-obvious coupling.

Inject explicitly:

```php
// ❌ hidden per-request coupling — the service SEEMS request-agnostic
final class Bad
{
    public function process(): void
    {
        Log::info('doing thing', ['user' => Auth::id()]);
    }
}

// ✅ obvious per-request coupling — reviewer sees the request scope
#[Scoped]
final class Good
{
    public function __construct(
        #[Log] private readonly LoggerInterface $log,
        #[CurrentUser] private readonly ?User $user,
    ) {}

    public function process(): void
    {
        $this->log->info('doing thing', ['user' => $this->user?->id]);
    }
}
```

Exception: **inside controllers**, `response()->json(...)` is fine — controllers
are inherently per-request.

### 3. No `app()->make(...)` inside constructors

The constructor of a `#[Singleton]` runs ONCE per worker at first resolution. If
it calls `app()->make(Auth::class)`, that manager is captured at that moment and
served forever.

```php
// ❌ Captures the boot-time auth manager
final class Bad
{
    public function __construct()
    {
        $this->auth = app('auth');
    }
}

// ✅ Attribute injection — resolved per-invocation
final class Good
{
    public function __construct(
        #[Auth] private readonly Guard $guard,
    ) {}
}
```

### 4. No `env()` outside `config/`

`env()` reads directly from the environment. Under Octane, config is cached but
env reads bypass the cache. Every request that hits an `env()` call re-parses
the environment — slow AND potentially inconsistent.

- **In config files**: `env()` is fine. Config is cached at boot.
- **Anywhere else**: use `config('...')` or `#[Config('...')]`.

### 5. No closure-scoped `use ($request)` captures on long-lived services

```php
// ❌ Closure captures a per-request Request into a singleton service
$this->app->singleton(WebhookDispatcher::class, function ($app) use ($request) {
    return new WebhookDispatcher($request->header('X-Signature'));
});
```

Use `#[Scoped]` and inject the header via `#[RouteParameter]` / `#[Context]` / a
header-reader service scoped per request.

### 6. No `Model::observe(...)` in a running service

Observers registered per-request stack under Octane. Use `#[ObservedBy(...)]` on
the model class — registered once at model boot, stays static across requests.

## The single-file cheat sheet

```php
use Stackra\Foundation\Contracts\Clock;
use Illuminate\Container\Attributes\{Auth, Cache, Config, CurrentUser, DB, Log};

// ✅ Idiomatic Octane-safe service:
//    - #[Scoped] because it touches request state (user).
//    - All framework services attribute-injected.
//    - Zero facades. Zero statics. Zero env(). Zero app().
//    - Pure constructor promotion for the domain deps.
#[Scoped]
#[Bind(InvoiceReporterInterface::class)]
final class InvoiceReporter implements InvoiceReporterInterface
{
    public function __construct(
        #[Log('billing')]                        private readonly LoggerInterface $log,
        #[Cache('redis')]                        private readonly Repository $cache,
        #[Config('billing.reporting.enabled')]   private readonly bool $enabled,
        #[Config('billing.reporting.batch_size')] private readonly int $batchSize,
        #[DB('reporting')]                       private readonly Connection $db,
        #[CurrentUser]                           private readonly ?User $user,

        private readonly Clock $clock,
        private readonly InvoiceRepositoryInterface $invoices,
    ) {}

    public function generate(string $tenantId): Report
    {
        if (! $this->enabled) {
            return Report::empty();
        }

        $this->log->info('generating report', [
            'tenant_id' => $tenantId,
            'user_id' => $this->user?->id,
        ]);

        // ... use $this->cache / $this->db / $this->invoices / $this->clock
    }
}
```

## Octane-specific service provider hooks

For state that MUST persist across requests (like our `CorrelationId::forget()`
guard), register listeners in the package provider's `bootBespoke()`:

```php
protected function bootBespoke(): void
{
    if (! class_exists(\Laravel\Octane\Events\RequestTerminated::class)) {
        return;
    }

    $this->app['events']->listen(
        \Laravel\Octane\Events\RequestTerminated::class,
        static function (): void {
            \Stackra\MyPackage\Support\SomeGlobal::reset();
        },
    );

    // Also handle non-Octane workers (queue, artisan) — a plain
    // Laravel RequestHandled event covers the sync path.
    $this->app['events']->listen(
        \Illuminate\Foundation\Http\Events\RequestHandled::class,
        static function (): void {
            \Stackra\MyPackage\Support\SomeGlobal::reset();
        },
    );
}
```

Use closures ONLY when the listener is a one-liner. Anything larger gets a
dedicated event listener class registered via `#[Bind]` + static method
reference so it stays serialisable under Octane worker restarts.

## Local dev vs. Octane parity

We run Octane in production. In development the default is `php artisan serve`
(fresh PHP process per request), which HIDES Octane-specific bugs. To catch
them:

1. Every PR that touches a `#[Singleton]` binding gets a manual
   `php artisan octane:start --workers=1 --max-requests=100` smoke test at least
   once.
2. CI runs the Pest suite once under `octane:test` (a Testbench variant that
   simulates worker reuse).
3. When in doubt, `#[Scoped]`. It's the safe default.

## Anti-patterns

| Anti-pattern                                                           | Preferred                                                                                                       |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `#[Singleton]` on a service that reads current user / tenant / request | `#[Scoped]`                                                                                                     |
| `private static array $cache` on a service                             | `#[Cache]`-injected repository, keys scoped per-request when needed                                             |
| `Auth::user()` inside a service method                                 | `#[CurrentUser]` constructor injection on a `#[Scoped]` service                                                 |
| `env('X')` inside a service                                            | `config('...')` at the config-file level; `#[Config('...')]` in the constructor                                 |
| `app()->make(Foo::class)` inside a constructor                         | `Foo` as a typed constructor parameter — container injects it                                                   |
| `Model::observe(FooObserver::class)` inside a service method           | `#[ObservedBy(FooObserver::class)]` on the model class                                                          |
| `Cache::store('redis')->put(...)` scattered through a service          | `#[Cache('redis')] Repository $cache` in the constructor                                                        |
| Static-property memoisation of expensive lookup                        | `#[Cache('array')]` with a `remember` call keyed appropriately                                                  |
| Injecting `Request $request` into a `#[Singleton]` service             | `#[Scoped]` + `#[RouteParameter]` / `#[Context]` / attribute-injected accessor                                  |
| Boot-time `Sentry::configureScope(...)` capturing request data         | `Sentry::configureScope(...)` inside a request-scoped reporter (see `SentryReporter` in the exceptions package) |
| Long-lived services holding open DB transactions across requests       | Transactions scoped to the service method call — `DB::transaction(fn () => ...)`                                |

## Rule of thumb

**If a reviewer asks "does this survive request-2 correctly?" and you have to
think about it: `#[Scoped]`. Only demote to `#[Singleton]` after proving
statelessness.**
