<?php

/**
 * @file packages/framework/caching/src/Attributes/Cacheable.php
 *
 * @description
 * Declarative cache-aside directive on a method or class. The
 * interceptor pipeline wraps the target's return value: on cache
 * hit the cached value is returned without invoking the method;
 * on miss the method executes and its return value is cached
 * under the composed key + tag chain.
 *
 * ## Key composition
 *
 * The final cache key is a concatenation of, in order:
 *
 *   1. the configured `caching.tag_prefix` (`stackra:` by default);
 *   2. the class + method (`App\Services\Athlete@list`);
 *   3. either the interpolated `$key` template
 *      (`athletes:{tenantId}:{locale}`) OR the string returned by
 *      the configured `CacheKeyGenerator`;
 *   4. a stable hash of any unnamed argument slots.
 *
 * ## Tag composition
 *
 * Static tags from the `$tags` list are merged with dynamic
 * tags from the registered {@see \Stackra\Caching\Contracts\CacheTagResolver}
 * chain. Duplicates are removed while preserving order.
 *
 * ## Attribute vs. explicit `Cache::tags(...)->remember(...)`
 *
 * The attribute is the terse path for the 90% case. Reach for
 * explicit `Cache::tags([...])->remember(...)` when:
 *
 *   - You need conditional caching (skip on some argument shapes).
 *   - The method has side-effects on the cache before returning.
 *   - You want to short-circuit reflection cost on a proven hot
 *     path.
 *
 * ## Placement
 *
 * Applied on:
 *
 *   - **Methods** — most common. The attribute governs that one
 *     method.
 *   - **Classes** — every public method inherits the directive
 *     unless it carries its own attribute. Useful for
 *     read-heavy repositories where the whole surface is
 *     `#[Cacheable]`.
 *
 * @see \Stackra\Caching\Attributes\CacheEvict Invalidation counterpart.
 * @see \Stackra\Caching\Attributes\CachePut  Write-through counterpart.
 * @see \Stackra\Caching\Contracts\CacheKeyGenerator Custom key strategy.
 */

declare(strict_types=1);

namespace Stackra\Caching\Attributes;

use Stackra\Caching\Contracts\CacheKeyGenerator;
use Stackra\Caching\Enums\CacheStrategy;
use Attribute;

/**
 * Cache the return value of a method (or every public method on
 * the target class) with a computed key + tag chain.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS)]
final readonly class Cacheable
{
    /**
     * @param  int|null                             $ttl
     *   TTL in seconds. `null` defers to `caching.default_ttl`
     *   (300 s by default).
     *
     * @param  string|null                          $key
     *   Optional key template. Supports `{argName}` interpolation
     *   for named method parameters — e.g. `athletes:{id}:{locale}`.
     *   Ignored when `$keyGenerator` is set.
     *
     * @param  class-string<CacheKeyGenerator>|null $keyGenerator
     *   FQCN of a `CacheKeyGenerator` implementation for cases the
     *   template can't cover. When set, `$key` is ignored.
     *
     * @param  list<string>                         $tags
     *   Static tag segments merged with the resolver chain output.
     *
     * @param  CacheStrategy                        $strategy
     *   Read strategy. Defaults to `Aside` (lazy-load); set to
     *   `WriteThrough` when the return value should also update
     *   the cache unconditionally on every call.
     *
     * @param  bool                                 $condition
     *   When `false`, the attribute is a no-op — useful for
     *   compile-time-toggling a cache path via a config-fed
     *   constant.
     */
    public function __construct(
        public ?int $ttl = null,
        public ?string $key = null,
        public ?string $keyGenerator = null,
        public array $tags = [],
        public CacheStrategy $strategy = CacheStrategy::Aside,
        public bool $condition = true,
    ) {
    }
}
