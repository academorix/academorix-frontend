<?php

/**
 * @file packages/framework/caching/src/Attributes/CachePut.php
 *
 * @description
 * Write-through cache directive. Semantically similar to
 * {@see Cacheable} but the method is ALWAYS executed — the
 * return value is written to the cache on every invocation.
 *
 * ## When to prefer `CachePut` over `Cacheable`
 *
 *   - **Freshest-value wins**: writes should be visible to the
 *     next reader immediately, without waiting for TTL.
 *   - **Warming path**: a scheduled worker recomputes an
 *     expensive projection every 5 minutes and writes it into
 *     the cache; readers pull without ever computing.
 *   - **Mutation methods** where you want to atomically update
 *     the row AND its cached shape (a common combination with
 *     `#[CacheEvict]` on siblings).
 *
 * ## Difference from `Cacheable`
 *
 *   - `Cacheable` short-circuits on cache hit. `CachePut` runs
 *     the method every time.
 *   - `Cacheable` writes only on miss. `CachePut` writes always.
 *   - Both share the same key + tag composition rules.
 *
 * @see \Academorix\Caching\Attributes\Cacheable Read counterpart.
 * @see \Academorix\Caching\Attributes\CacheEvict Invalidation counterpart.
 */

declare(strict_types=1);

namespace Academorix\Caching\Attributes;

use Academorix\Caching\Contracts\CacheKeyGenerator;
use Attribute;

/**
 * Always execute the method AND write its return value to the
 * cache. Write-through.
 */
#[Attribute(Attribute::TARGET_METHOD)]
final readonly class CachePut
{
    /**
     * @param  int|null                             $ttl           TTL in seconds; null = `caching.default_ttl`.
     * @param  string|null                          $key           Optional key template (see `#[Cacheable]::$key`).
     * @param  class-string<CacheKeyGenerator>|null $keyGenerator  Optional generator FQCN.
     * @param  list<string>                         $tags          Static tag segments merged with the resolver chain.
     * @param  bool                                 $condition     Compile-time toggle.
     */
    public function __construct(
        public ?int $ttl = null,
        public ?string $key = null,
        public ?string $keyGenerator = null,
        public array $tags = [],
        public bool $condition = true,
    ) {
    }
}
