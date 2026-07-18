<?php

/**
 * @file packages/framework/caching/src/Attributes/CacheEvict.php
 *
 * @description
 * Declarative cache-invalidation directive. After the annotated
 * method completes successfully, the interceptor flushes every
 * cached entry that carries any of the listed tags (or, when
 * `$keys` is set, forgets those exact keys).
 *
 * ## Timing — after, not before
 *
 * Invalidation runs AFTER the method returns without throwing.
 * If the method throws, the cache is left intact — you don't
 * want an aborted write to blow the cache and force a re-fetch
 * from a still-stale source of truth.
 *
 * ## Fan-out
 *
 * Tags support the standard multi-tenant flush pattern:
 *
 * ```php
 * #[CacheEvict(tags: ['athletes'])]           // per-table
 * public function update(Athlete $a): void { … }
 *
 * #[CacheEvict(tags: ['athletes', 'sessions'])]  // fan across two tables
 * public function reassignCoach(Athlete $a, User $coach): void { … }
 *
 * #[CacheEvict(allEntries: true)]              // full flush (use sparingly)
 * public function rebuildTenant(): void { … }
 * ```
 *
 * ## Key vs. tag invalidation
 *
 * Prefer tags for anything that reads more than a single row —
 * `tags: ['athletes']` clears the list cache, individual row
 * caches, and any aggregate that was tagged with `athletes`.
 * Use `$keys` when you know the exact keys to forget and don't
 * want to blow neighbours.
 *
 * @see \Academorix\Caching\Attributes\Cacheable Read counterpart.
 * @see \Academorix\Caching\Attributes\CachePut  Write-through counterpart.
 */

declare(strict_types=1);

namespace Academorix\Caching\Attributes;

use Attribute;

/**
 * Invalidate cache entries after this method completes.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class CacheEvict
{
    /**
     * @param  list<string>  $tags
     *   Cache tags to flush. Every entry carrying any of these
     *   tags is evicted.
     *
     * @param  list<string>  $keys
     *   Explicit cache keys to forget. Supports `{argName}`
     *   interpolation the same way `#[Cacheable]::$key` does.
     *
     * @param  bool          $allEntries
     *   When `true`, flush the entire cache store. Reserve for
     *   admin tools ("rebuild everything") — never wire onto a
     *   per-request write path.
     *
     * @param  bool          $beforeInvocation
     *   When `true`, invalidate BEFORE the method runs. The safe
     *   default is `false` (after), so a throwing method leaves
     *   the cache alone.
     *
     * @param  bool          $condition
     *   Compile-time toggle. Same semantics as
     *   `#[Cacheable]::$condition`.
     */
    public function __construct(
        public array $tags = [],
        public array $keys = [],
        public bool $allEntries = false,
        public bool $beforeInvocation = false,
        public bool $condition = true,
    ) {
    }
}
