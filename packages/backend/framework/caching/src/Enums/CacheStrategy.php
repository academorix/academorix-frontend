<?php

/**
 * @file packages/framework/caching/src/Enums/CacheStrategy.php
 *
 * @description
 * The write / read strategies the `#[Cacheable]` and `#[CachePut]`
 * interceptors understand. Named after the standard cache-pattern
 * catalog — see Redis Labs' or Microsoft's cache-pattern docs
 * for the theory.
 */

declare(strict_types=1);

namespace Stackra\Caching\Enums;

use Stackra\Enum\Enum;

/**
 * Cache read/write strategies applied by `#[Cacheable]` and
 * `#[CachePut]` interceptors. `Aside` is the safe default.
 */
enum CacheStrategy: string
{
    use Enum;

    /**
     * Cache-aside (aka lazy-loading). Read: return cached value
     * on hit, execute method + populate cache on miss. Write:
     * responsibility of the caller — this strategy alone does
     * not invalidate on writes.
     *
     * Best for read-heavy workloads where stale data is
     * acceptable up to the TTL boundary.
     */
    case Aside = 'aside';

    /**
     * Write-through. The method ALWAYS executes; the result is
     * always written to the cache. Reads that follow a write
     * see the freshest value immediately.
     *
     * Best for hot writable state where read latency matters
     * and eventual consistency is not acceptable.
     */
    case WriteThrough = 'write-through';

    /**
     * Write-behind (aka write-back). The method executes and
     * the result is queued for asynchronous cache write. Not
     * currently implemented by the shipped interceptor — the
     * enum case exists so the strategy space is documented and
     * future work can slot in without touching the attribute.
     */
    case WriteBehind = 'write-behind';

    /**
     * Read-through. Reads that miss the cache trigger the
     * method transparently through a wrapper; writes are
     * expected to invalidate via `#[CacheEvict]`. Semantically
     * equivalent to `Aside` when the wrapper IS the caller,
     * but preserved as a distinct case for symmetry with
     * "write-through".
     */
    case ReadThrough = 'read-through';
}
