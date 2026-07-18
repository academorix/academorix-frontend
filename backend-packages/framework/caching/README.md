# academorix/caching

Attribute-driven cache composition. The substrate every other
package builds on when it needs read-through caching, tag-based
invalidation, or tenant-scoped cache keys.

## What ships

**Attributes (declarative directives on classes / methods):**

- `#[Cacheable(ttl, key, tags, strategy)]` — cache the return
  value of a method with a computed key.
- `#[CacheEvict(tags, keys, allEntries)]` — invalidate cache
  entries after the method completes.
- `#[CachePut(ttl, key, tags)]` — always execute the method AND
  write the result to the cache (write-through).
- `#[CacheKey(template)]` — declarative key template (`user:{id}`).
- `#[CacheTag(name, resolver)]` — pin an additional tag on
  a cache entry.
- `#[CacheTtl(seconds)]` — TTL override without the full
  `#[Cacheable]` block.
- `#[AsCacheTagResolver(priority, enabled)]` — mark a class
  implementing `CacheTagResolver` for boot-time discovery.

**Contracts:**

- `CacheTagResolver` — contributes zero-or-more tag segments to
  every composed tag chain. Discovery happens at boot via
  `olvlvl/composer-attribute-collector`.
- `CacheKeyGenerator` — custom key generation strategy.

**Support classes:**

- `CacheTagBuilder` — composes deterministic tag lists from the
  registered resolver chain. Stateless, injectable, Octane-safe.
- `CacheKeyBuilder` — composes deterministic cache keys from
  template + argument bindings.
- `TaggableCacheGuard` — driver-capability probe; transparently
  degrades tag operations to plain cache calls on array / file /
  database drivers.

**Registry:**

- `CacheTagResolverRegistry` — boot-time discovery result;
  memoises the sorted resolver list per worker.

## What does NOT ship

- Tenant awareness. `TenantAwareCacheTagResolver` lives in
  `packages/framework/tenancy/` and depends on this package's
  `#[AsCacheTagResolver]` + `CacheTagResolver` contract.
- Eloquent hooks. The database package layers on top when a
  model wants automatic tag invalidation on save.

## Wiring in a consumer app

```php
// bootstrap/app.php — nothing needed. Laravel's provider
// discovery picks up CachingServiceProvider automatically.
```

That's it. Every attribute is either discovered at boot
(`#[AsCacheTagResolver]`) or intercepted per-method via the
container's `resolving()` hook (`#[Cacheable]` and friends).

## Programmatic use

```php
use Academorix\Caching\Support\CacheTagBuilder;

final class AthleteRepository
{
    public function __construct(
        private readonly CacheTagBuilder $cacheTags,
    ) {}

    public function all(): Collection
    {
        $tags = $this->cacheTags->for('athletes');   // ['athletes', 'tenant:42']
        return Cache::tags($tags)->remember('athletes:all', 300, fn () => …);
    }
}
```

Or purely declaratively:

```php
use Academorix\Caching\Attributes\Cacheable;

final class AthleteService
{
    #[Cacheable(ttl: 300, tags: ['athletes'], key: 'athletes:all')]
    public function all(): Collection { … }
}
```
