---
inclusion: fileMatch
fileMatchPattern: "packages/framework/{caching,tenancy}/**/*.php"
---

# Cache-tag resolvers — the attribute-discovered contributor pattern

`CacheTagBuilder` composes every tag chain from a REGISTRY of resolvers. Each
resolver contributes zero-or-more tag segments (`tenant:<id>`, `locale:<bcp47>`,
`feature:<slug>`, ...). Resolvers are discovered at boot via
`#[AsCacheTagResolver]`, sorted by priority, and walked in order.

This is the pattern codified by
[ADR-0004](../../docs/adr/0004-cache-tag-resolver-via-attribute.md). Any new
concern that wants to contribute segments to the shared cache-tag chain follows
this same shape.

## Ownership

Three packages, three roles — never conflate:

- **`packages/framework/caching/`** owns the primitive: the `CacheTagResolver`
  contract, the `#[AsCacheTagResolver]` attribute, `CacheTagBuilder`,
  `TaggableCacheGuard`, `NullCacheTagResolver`. This package knows nothing about
  tenants, locales, feature flags, or any concrete domain concept.
- **`packages/framework/tenancy/src/Cache/`** owns the concrete
  `TenantAwareCacheTagResolver` — because tenancy owns the tenant context. Not
  `caching`, not `database`.
- **Any other framework package** that wants to contribute segments ships its
  own resolver, in its own `src/Cache/` folder, carrying
  `#[AsCacheTagResolver(priority: N)]`.

The database package MUST NOT depend on `caching` for tenancy semantics — the
historic entanglement is what ADR-0004 dissolves.

## The contract

```php
namespace Academorix\Caching\Contracts;

interface CacheTagResolver
{
    /**
     * Contribute zero-or-more tag segments.
     *
     * @return list<string>  Empty list when this resolver has nothing to
     *                       contribute — callers never null-check.
     */
    public function resolve(): array;
}
```

Non-negotiable:

- Return type is `list<string>` — an integer-indexed, gap-free array. Never a
  keyed array.
- Return `[]` when the resolver has nothing to contribute. Never throw when the
  concern is simply absent (no tenant in central context, no locale configured,
  etc.). Fail-soft — never break tag composition.
- Tag segments are `<namespace>:<value>` shaped: `tenant:01H...`,
  `locale:en-GB`, `feature:new_billing_flow`. The colon is the segment
  separator; the value must not contain another colon.

## The attribute

```php
namespace Academorix\Caching\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsCacheTagResolver
{
    public function __construct(
        public int  $priority = 100,   // lower runs first
        public bool $enabled  = true,
    ) {}
}
```

Priority ranges — reserve them consistently across the monorepo:

| Range          | Purpose                            | Example                                                                                                       |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **0 .. 49**    | Framework primitives               | `NullCacheTagResolver` (priority 0)                                                                           |
| **50 .. 149**  | Cross-cutting shared concerns      | `TenantAwareCacheTagResolver` (100), `LocaleAwareCacheTagResolver` (110), `RegionAwareCacheTagResolver` (120) |
| **150 .. 249** | Feature-flag / experiment overlays | `FeatureFlagCacheTagResolver` (200)                                                                           |
| **250 .. 999** | Per-domain contributors            | Domain-specific resolvers                                                                                     |

Lower priority runs first. Ties break by FQCN so tag composition is stable
across boots (same inputs → same tag string → same cache key).

## Discovery + hydration

Discovery uses the shared `DiscoversAttributes` seam. Never touch
`olvlvl\ComposerAttributeCollector\Attributes` directly:

```php
final class CacheTagResolverBootstrapper extends AbstractBootstrapper
{
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly CacheTagBuilder $builder,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    public function name(): string
    {
        return 'caching.tag_resolvers';
    }

    public function priority(): int
    {
        return 60; // framework primitives range
    }

    public function populate(): void
    {
        $resolvers = [];

        foreach ($this->discovery->forClass(AsCacheTagResolver::class) as $target) {
            if ($target->attribute->enabled === false) {
                continue;
            }

            try {
                /** @var CacheTagResolver $instance */
                $instance = $this->container->make($target->className);
            } catch (\Throwable $e) {
                $this->log->warning('cache-tag resolver discovery: unresolvable class', [
                    'class' => $target->className,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            if (! $instance instanceof CacheTagResolver) {
                $this->log->warning('cache-tag resolver discovery: does not implement contract', [
                    'class' => $target->className,
                ]);
                continue;
            }

            $resolvers[] = [
                'priority' => $target->attribute->priority,
                'fqcn'     => $target->className,
                'instance' => $instance,
            ];
        }

        // Stable sort: priority asc, then FQCN asc.
        usort($resolvers, function (array $a, array $b): int {
            return [$a['priority'], $a['fqcn']] <=> [$b['priority'], $b['fqcn']];
        });

        foreach ($resolvers as $row) {
            $this->builder->register($row['instance']);
        }

        $this->log->info('cache-tag resolver discovery complete', ['count' => \count($resolvers)]);
    }
}
```

`CacheTagBuilder` holds the resolvers as a `#[Singleton]` — populated ONCE per
worker at boot, walked per tag composition. No runtime reflection.

## Concrete resolver — the canonical shape

```php
namespace Academorix\Tenancy\Cache;

use Academorix\Caching\Attributes\AsCacheTagResolver;
use Academorix\Caching\Contracts\CacheTagResolver;
use Academorix\Tenancy\Contracts\TenantContext;

/**
 * Contributes the active tenant's identifier as a `tenant:<id>` segment.
 *
 * Fails soft when the request is in central context (no active tenant).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsCacheTagResolver(priority: 100)]
final class TenantAwareCacheTagResolver implements CacheTagResolver
{
    public function __construct(
        private readonly TenantContext $tenants,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function resolve(): array
    {
        $tenant = $this->tenants->currentOrNull();

        return $tenant === null ? [] : ['tenant:' . $tenant->getKey()];
    }
}
```

Line-by-line contract:

- Depends on `TenantContext` (the framework contract) — never on
  `Stancl\Tenancy\Contracts\Tenant` (a specific backend).
- Constructor DI via container attributes for anything cross-cutting (`#[Log]`,
  `#[Cache]`, etc.). No facades, no `app()` inside `resolve()`.
- `resolve()` returns `[]` in central context — never throws.
- Class docblock cites `@category` + `@since` (framework package).

## Non-negotiable rules

1. **One class, one concern.** A resolver contributes ONE segment type
   (`tenant:*`, `locale:*`, `feature:*`). If you want two segment types, ship
   two classes.
2. **Constructor-inject via container attributes only.** No facades, no `app()`
   calls, no `resolve()` calls inside `resolve()`. See
   `.kiro/steering/octane-first-di.md`.
3. **Deterministic order.** Two workers must produce byte-identical tag strings
   for the same request. Priority + FQCN tie-break enforces this at discovery
   time; resolvers must not introduce non-determinism inside `resolve()` (no
   `time()`, no `Str::random()`, no unordered `array_map`).
4. **Fail-soft.** A misconfigured resolver LOGs + returns `[]`. It never throws
   — a broken resolver must not break every cache read.
5. **Octane-safe.** Resolvers are typically `#[Singleton]` (stateless
   contributors) or `#[Scoped]` (when they read request state like
   `TenantContext` or `Auth::user()`). Never hold mutable state across requests.
6. **Enabled flag.** `#[AsCacheTagResolver(enabled: false)]` disables a resolver
   without deleting the class — useful for feature-flagging a contributor.

## Testing

Unit test each resolver in isolation with a stubbed dependency:

```php
it('emits tenant:<id> when the tenant context is populated', function (): void {
    $context = Mockery::mock(TenantContext::class);
    $context->shouldReceive('currentOrNull')->andReturn(
        Tenant::factory()->make(['id' => 'tnt_01H...']),
    );

    $resolver = new TenantAwareCacheTagResolver($context);

    expect($resolver->resolve())->toBe(['tenant:tnt_01H...']);
});

it('emits an empty list in central context', function (): void {
    $context = Mockery::mock(TenantContext::class);
    $context->shouldReceive('currentOrNull')->andReturn(null);

    $resolver = new TenantAwareCacheTagResolver($context);

    expect($resolver->resolve())->toBe([]);
});
```

Integration-test the discovery + hydration by binding an
`InMemoryDiscoversAttributes` fake and asserting `CacheTagBuilder` composes the
expected chain — see `.kiro/steering/discovery.md` §Test doubles.

## Anti-patterns

| Anti-pattern                                                                              | Correct                                                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Concrete tenant / locale resolver in `packages/framework/caching/`                        | Concrete resolvers live in the package that owns their domain (`tenancy`, `localization`, etc.). `caching` ships only the primitive. |
| Resolver depending on `Stancl\Tenancy\Contracts\Tenant` (or any specific vendor contract) | Depend on the framework contract (`TenantContext`, `LocaleContext`) — never on a vendor implementation.                              |
| `resolve()` throws when the concern is absent                                             | Return `[]`. Fail-soft.                                                                                                              |
| Return a keyed array (`['tenant' => 'tnt_...']`)                                          | Return `list<string>` of `<namespace>:<value>` strings.                                                                              |
| Injecting `CacheTagBuilder` into a resolver                                               | The builder OWNS the resolvers; resolvers must not know the builder exists.                                                          |
| Manual `array_merge` inside `CacheTagBuilder` after resolvers register themselves         | Discovery hydrates the builder ONCE at boot. Runtime `register()` calls after boot are a code smell.                                 |
| `#[AsCacheTagResolver]` without `priority:` set (falls back to 100 default)               | Set the priority explicitly per the range table above so ordering is intentional.                                                    |
| Two resolvers with the same priority AND the same FQCN prefix (unstable tie-break)        | Assign distinct priorities. FQCN tie-break is a safety net, not an intent.                                                           |
| Resolver reads `request()` directly                                                       | Inject the framework contract (`RequestContext`, `TenantContext`, etc.) — never touch `request()` inside `resolve()`.                |
| Resolver in `database` package                                                            | Move to the framework package that owns the resolver's domain (typically `tenancy` for tenant tags).                                 |

## Related steering + ADRs

- [ADR-0004](../../docs/adr/0004-cache-tag-resolver-via-attribute.md) — the
  decision this steering codifies.
- `.kiro/steering/discovery.md` — the shared `DiscoversAttributes` seam every
  resolver bootstrapper uses.
- `.kiro/steering/bootstrappers.md` — the `AbstractBootstrapper` contract the
  resolver bootstrapper extends.
- `.kiro/steering/octane-first-di.md` — why resolvers are `#[Singleton]` /
  `#[Scoped]` and never hold cross-request state.
- `.kiro/steering/contract-implementer-split.md` — the shape both the primitive
  package (`caching`) and its contributors follow.
- `.kiro/steering/tenancy-hooks.md` — the sibling pattern for per-tenant
  lifecycle (NOT for tag contribution).
- `.kiro/steering/php-attributes.md` §Custom attributes — how
  `#[AsCacheTagResolver]` sits in the broader attribute catalogue.
