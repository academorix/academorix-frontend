---
inclusion: fileMatch
fileMatchPattern: "**/Bootstrappers/**/*.php"
---

# Bootstrapper pattern — app-boot discovery + cache warming

Every attribute-driven registry in the monorepo is hydrated at framework boot.
Boot-time work happens ONCE — the result is cached; per-request code touches a
hot, pre-populated registry with zero reflection.

Two shapes of boot work exist and they must not be conflated:

1. **`#[HydratesFrom]` — the default for attribute-driven registries.** Ninety
   percent of "I have an `#[AsX]` catalogue that needs to land in a registry"
   uses this path. Zero bespoke bootstrapper class per attribute.
2. **`#[AsBootstrapper]` — the escape hatch for the remaining ten percent.**
   Reach for it only when the boot work does NOT fit the "walk an attribute →
   call `register()` on a registry" shape.

## `#[HydratesFrom]` — the canonical hydration path

Every domain package that ships an `#[AsX]` catalogue:

1. Ships the attribute (`AsWebhookEvent`, `AsPayloadTransformer`, ...).
2. Ships a registry interface with **one method** carrying
   `#[HydratesFrom(AsX::class)]`.
3. Ships a concrete registry that implements the method. The `register()` method
   owns the domain logic — in-memory map, `Artisan::add()`, `Route::addRoute()`,
   `Gate::policy()`, whatever the domain needs.

The framework's single {@see HydrationBootstrapper} scans every
`#[HydratesFrom]` in the codebase, resolves each declaring interface from the
container, iterates targets of the referenced attribute, and calls the method
with `(class_name, attribute_instance)`. Zero per-module bootstrapper classes.
Zero provider knowledge of what discoverables exist.

### The three-file shape

```php
// 1. The attribute — what the domain wants to discover.
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsWebhookEvent
{
    public function __construct(
        public string $name,
        public string $version,
        public string $description,
    ) {}
}
```

```php
// 2. The registry INTERFACE — declares the hydration binding.
#[Bind(WebhookRegistry::class)]
#[Singleton]
interface WebhookRegistryInterface
{
    #[HydratesFrom(AsWebhookEvent::class)]
    public function register(string $className, AsWebhookEvent $attribute): void;

    public function all(): array;
    public function has(string $eventName): bool;
}
```

```php
// 3. The concrete registry — owns the "how".
final class WebhookRegistry implements WebhookRegistryInterface
{
    private array $events = [];

    public function register(string $className, AsWebhookEvent $attribute): void
    {
        $this->events[$attribute->name] = [
            'class'       => $className,
            'version'     => $attribute->version,
            'description' => $attribute->description,
        ];
    }

    public function all(): array { return $this->events; }
    public function has(string $eventName): bool { return isset($this->events[$eventName]); }
}
```

That's the whole module-side contribution. No bootstrapper class. No provider
array. No `#[Discovers]` on the provider. The registry interface owns the
declaration; the concrete owns the storage/wiring; the framework owns the pump.

### When to use `#[HydratesFrom]`

Use it whenever the boot work fits this shape:

- **Trigger**: a class carries an `#[AsX]` attribute.
- **Effect**: a domain registry receives one `register()` call per hit.

Which is nearly every attribute-driven boot pass in the codebase — webhook
events, webhook destinations, payload transformers, api surfaces, version
schemes, activity types, auditable models, settings groups, file kinds,
entitlement consumers, tenancy hooks, and so on.

## `#[AsBootstrapper]` — the escape hatch

Bespoke boot work that does NOT fit the "walk an attribute → call `register()`
on a registry" pattern gets a custom `AbstractBootstrapper` subclass carrying
`#[AsBootstrapper]`. The framework's meta-{@see
BootstrapperDiscoveryBootstrapper} scans every class carrying the attribute at
priority `-1000` and registers them with the shared registry.

Legitimate escape-hatch use cases:

- **Idempotent DB projections** — e.g. seeding the `business_types` table from
  {@see BusinessTypeEnum} on every boot (see
  `.kiro/steering/enum-db-seed-dual-source.md`).
- **External state warmups** — warm a DNS cache, pre-open a queue connection,
  register a callback with a third-party SDK.
- **Complex multi-attribute reconciliation** — the bootstrapper needs to read
  TWO attributes and cross-reference them before writing to state.
- **Compliance registrations** — e.g. registering per-module retention policies
  with a global retention framework that requires side effects beyond
  `register(class, attribute)`.

If your bootstrapper's `populate()` reduces to a single
`foreach ($discovery->forClass(X) as $t) { $registry->register(...); }` loop,
you're re-implementing what `#[HydratesFrom]` does for free. Delete the class
and add the attribute to the registry interface.

### Escape-hatch shape

```php
#[AsBootstrapper(priority: 200)]
#[Singleton]
final class BusinessTypeSeedBootstrapper extends AbstractBootstrapper
{
    public function __construct(
        #[Log] private readonly LoggerInterface $log,
    ) {}

    public function name(): string  { return 'tenancy.business-types'; }
    public function priority(): int { return 200; }
    public function isCacheable(): bool { return false; }   // idempotent DB write, never cache

    public function populate(): void
    {
        // Domain-specific work that doesn't fit the register(class, attribute) shape.
    }
}
```

## Location

Bootstrapper subclasses live in `<module>/src/Bootstrappers/` — one folder, one
primitive. Registry interfaces + concretes live in `<module>/src/Registry/`. See
`.kiro/steering/folder-conventions.md` for the locked per-folder ownership
table.

Anti-patterns (fail the review):

- Bootstrapper class in `Concerns/`, `Support/`, or `Services/`.
- Registry class in `Support/` or `Services/`.
- A bespoke `<Foo>DiscoveryBootstrapper` whose entire body is a single
  discovery-loop that could be a `#[HydratesFrom]` on the registry interface.

## The two boot-time concepts, side by side

| Concept                                                 | Runs when               | Fires what                                                                                                 | Cached?                                      |
| ------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Bootstrapper** (this file)                            | Once at framework boot  | Populates registries, warms external state                                                                 | Yes — framework cache under `bootstrapper.*` |
| **TenancyHook** (see `.kiro/steering/tenancy-hooks.md`) | Every tenant init / end | Per-tenant `bootstrap($tenant)` / `revert()` (spatie/permission team context, tenant-scoped cache warm, …) | No — per-tenant lifecycle                    |

**When someone says "bootstrapper" without qualifier, they mean the one on THIS
page — the app-boot discovery+cache class.** Never overload the word.

## The `AbstractBootstrapper` contract (escape-hatch shape)

Every escape-hatch bootstrapper extends
`Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper`:

```php
#[AsBootstrapper(priority: 120)]
final class SomeBootstrapper extends AbstractBootstrapper
{
    public function name(): string { return 'ai.personas'; }
    public function priority(): int { return 120; }
    public function populate(): void { /* the work */ }
}
```

The base class handles:

- Cache read on entry — if the payload deserializes cleanly via
  `fromCachePayload()`, `populate()` is skipped.
- Cache write on exit — after `populate()` runs, `toCachePayload()` is
  serialized to `cacheKey()` for the next boot.
- Error isolation — an exception in one bootstrapper is logged + swallowed;
  other bootstrappers still run.
- Timing — the runner logs one INFO line per bootstrapper with duration + cache
  hit/miss.

## Cache semantics

Framework cache — not tenant cache. The `bootstrapper.*` keys live in the app's
default cache store and survive across requests but are wiped by:

- `php artisan bootstrap:clear` (explicit)
- `php artisan cache:clear` (general purge)
- Composer autoload dump (post-hook clears them so a newly-attributed class is
  picked up)

In production, deploy scripts run `php artisan bootstrap:cache` after
`composer install` so the FIRST request pays zero discovery cost — every
subsequent boot hydrates from the cache.

**Never cache tenant-scoped data in a bootstrapper.** Bootstrappers are for
platform-level catalogues. Tenant state belongs on `TenancyHook`s.

### Cacheable vs non-cacheable

Default `isCacheable()` is `true`. Return `false` when:

- The registry is trivially cheap to build (< 1 ms per boot).
- The payload isn't safely serializable (contains closures, container-bound
  objects, database rows).
- The bootstrapper interacts with the DB / external services in ways that
  shouldn't be cached (e.g., "seed a table from an enum").

Cacheable bootstrappers implement both `toCachePayload()` +
`fromCachePayload($payload): bool`. `fromCachePayload` returns `true` when the
payload was accepted (skip `populate()`); returns `false` when stale/invalid
(fall through to `populate()`).

The generic {@see HydrationBootstrapper} that services `#[HydratesFrom]` already
implements the cache pair — every `#[HydratesFrom]` binding gets cache-aware
boot for free.

## Priority ordering

| Range           | Purpose                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **-1000 .. -1** | Meta-bootstrappers — `BootstrapperDiscoveryBootstrapper` (-1000), `HydrationBootstrapper` (-900). Framework-internal; do not squat this range in domain code. |
| **0 .. 99**     | Framework primitives — cache tag resolvers, event listener registry, route table.                                                                             |
| **100 .. 199**  | Domain modules — personas, tools, retention policies, settings, permissions.                                                                                  |
| **200 .. 999**  | Consumer overlays — feature flags, experiments, per-tenant overrides. Also the seed-from-enum bootstrappers (see `enum-db-seed-dual-source.md`).              |
| **1000+**       | Diagnostics only — smoke checks, warm-cache probes.                                                                                                           |

Ties break by insertion cursor so ordering stays stable across runs and cache
hashes match.

## Registration — one path, attribute-first

`#[AsBootstrapper]` is the ONLY registration path. The framework's
`BootstrapperDiscoveryBootstrapper` scans every class carrying the attribute at
boot and adds them to the shared `BootstrapperRegistry`.

**Provider-level `protected array $bootstrappers = [...]` arrays are removed.**
Every bootstrapper self-declares via the attribute — no property arrays, no
`bootstrappers()` methods, no manual `$registry->register(...)` in the provider.
Consistency with `#[AsModule]` / `#[LoadsResources]` / `#[AsSeeder]` which are
all class-level attributes on the target.

## Anti-patterns

- ❌ Bootstrapper class whose entire `populate()` is a single-loop discovery
  push — use `#[HydratesFrom]` on the registry interface instead. Delete the
  class.
- ❌ `protected array $bootstrappers = [...]` on a provider — removed. Add
  `#[AsBootstrapper(priority: N)]` to the class instead.
- ❌ Bootstrapper touches the request/session/user — bootstrappers run at APP
  boot, not per-request. There's no request in flight. If you need per-request
  or per-tenant state, use a `TenancyHook` or a `#[Scoped]` service.
- ❌ Bootstrapper caches tenant-scoped data — that data varies per tenant;
  bootstrappers cache platform-level.
- ❌ Two bootstrappers populate the same registry — one class, one registry. If
  two data sources feed one registry, one bootstrapper merges them.
- ❌ Bootstrapper throws on missing data — log a WARNING + return empty. A
  missing domain package shouldn't halt boot.
- ❌ Bootstrapper depends on another bootstrapper's registry to populate —
  express the ordering via `priority()` and DON'T serialize the second
  bootstrapper's runtime state as an input. Every bootstrapper is a pure
  function of `(discovered classes, container)`.
- ❌ Renaming the "DiscoveryBootstrapper" concept back into life — every
  hand-rolled `<Domain>DiscoveryBootstrapper` collapses into a `#[HydratesFrom]`
  on the registry interface. `#[AsBootstrapper]` stays for the escape-hatch
  cases only.

## Related steering

- `.kiro/steering/discovery.md` — the `DiscoversAttributes` seam the framework
  and every escape-hatch bootstrapper uses.
- `.kiro/steering/tenancy-hooks.md` — the sibling concept: per-tenant lifecycle
  callbacks.
- `.kiro/steering/octane-first-di.md` — why the registries these bootstrappers
  populate are `#[Singleton]` (stateless catalogues) and never `#[Scoped]`.
- `.kiro/steering/enum-db-seed-dual-source.md` — the canonical escape-hatch case
  (seed a table from an enum on every boot).
