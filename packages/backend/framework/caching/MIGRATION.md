# Migration guide — cache primitives → `stackra/caching`

Per **ADR 0004**, every cache primitive that used to live inside
`packages/framework/database/src/Cache/` has moved into the new
`packages/framework/caching/` package. The database package no longer ships
cache-tag composition or driver-capability logic.

## What moved

| Old location                                                            | New location                                                           | Notes                                                                                                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/framework/database/src/Cache/CacheTagBuilder.php`             | `packages/framework/caching/src/Support/CacheTagBuilder.php`           | Constructor now takes `CacheTagResolverRegistry` (was `TenantAwareCacheTagResolver`).                                                                         |
| `packages/framework/database/src/Cache/TaggableCacheGuard.php`          | `packages/framework/caching/src/Support/TaggableCacheGuard.php`        | Fail-open behaviour is now config-driven (`caching.fail_open_untagged`).                                                                                      |
| `packages/framework/database/src/Cache/TenantAwareCacheTagResolver.php` | `packages/framework/tenancy/src/Cache/TenantAwareCacheTagResolver.php` | Rewritten to depend on `TenantContext` (the framework contract) instead of `Stancl\Tenancy\Contracts\Tenant`. Carries `#[AsCacheTagResolver(priority: 100)]`. |

## What is NEW

- **`#[AsCacheTagResolver]`** attribute — discovery marker for every
  `CacheTagResolver` implementation. Replaces the old hard-coded resolver
  constructor argument on `CacheTagBuilder`.
- **`CacheTagResolver` contract** — many-to-one composition; any package can
  ship its own tag contributor.
- **`CacheTagResolverRegistry`** — boot-time discovery output; memoised for the
  worker's lifetime.
- **`#[Cacheable]`, `#[CachePut]`, `#[CacheEvict]`, `#[CacheKey]`,
  `#[CacheTag]`, `#[CacheTtl]`** — declarative attributes that replace
  hand-rolled `Cache::tags(...)->remember(...)` patterns in repositories.
- **`CacheKeyBuilder`** — deterministic template-based key composer with xxh128
  hashing for non-scalars.
- **`InteractsWithCache`** trait — three convenience helpers (`cacheRemember`,
  `cacheForget`, `cacheFlush`) for classes that read + write frequently.

## Consumer changes

### 1. Update every `use` statement

```diff
- use Stackra\Database\Cache\CacheTagBuilder;
+ use Stackra\Caching\Support\CacheTagBuilder;

- use Stackra\Database\Cache\TaggableCacheGuard;
+ use Stackra\Caching\Support\TaggableCacheGuard;
```

### 2. `CacheTagBuilder->for($table, $tenantId)` → `->for($table, $context)`

The old signature accepted an optional tenant-id override as the second
positional argument. The new signature accepts a free-form `$context` map for
every registered resolver. Tenancy consumers pass:

```diff
- $this->cacheTags->for('athletes', $tenantId);
+ $this->cacheTags->for('athletes', ['tenantId' => $tenantId]);
```

The `TenantAwareCacheTagResolver` reads `context['tenantId']` first, falling
back to `$this->tenantContext->id()` when absent. Callers that don't need to
override just pass no second arg.

### 3. Update `composer.json`

Domain packages that used to require `stackra/database` for cache primitives
now require both:

```diff
"require": {
    "stackra/database": "@dev",
+   "stackra/caching": "@dev"
}
```

Apps that already require `stackra/tenancy` (framework) get the caching
package transitively.

### 4. Refactor manual `Cache::tags(...)->remember(...)` calls

Optional — the old pattern still works. But new code should reach for the trait:

```diff
- $tags = $this->cacheTags->for($table);
- return Cache::tags($tags)->remember($key, 300, $callback);
+ return $this->cacheRemember($table, $key, $callback, ttlSeconds: 300);
```

Or the attribute path when the whole method should cache:

```diff
+ #[Cacheable(ttl: 300, tags: ['athletes'], key: 'athletes:all')]
  public function all(): Collection { … }
```

## Rollout order

1. Add `stackra/caching` to every app that requires `stackra/database`
   today.
2. Ship the deprecated `Stackra\Database\Cache\*` classes as thin aliases
   that extend the new location — allow one release cycle for consumers to
   migrate their imports.
3. In the next major, delete the aliases.

## Status of the current tree

- `packages/framework/caching/` — this package. Complete + wired.
- `packages/framework/database/src/Cache/` — **deleted** as part of this same
  change; the alias step is not necessary while the framework is pre-1.0.
- `packages/framework/tenancy/` — created alongside this change; see its own
  MIGRATION.md.
