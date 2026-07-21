<?php

/**
 * @file packages/framework/caching/src/Support/CacheTagBuilder.php
 *
 * @description
 * Composes deterministic cache-tag lists from a base table name
 * (or list of tables) plus every registered
 * {@see \Stackra\Caching\Contracts\CacheTagResolver}'s output.
 *
 * ## Design goals
 *
 *   - **Injectable, stateless.** Constructor takes the resolver
 *     registry; the builder itself carries no per-request state
 *     which keeps it Octane-safe.
 *   - **Deterministic.** Same inputs produce the same tag list
 *     in the same order — the cache-tag hash is stable across
 *     workers so cache reads and writes align.
 *   - **Fan-friendly.** `forMany()` accepts a table list and
 *     de-duplicates the composed tag output so a single flush
 *     doesn't hit Redis with a redundant tag set.
 *
 * ## Composition rule
 *
 * The final tag list is `[$table, …resolverSegments]`. Every
 * resolver's `resolve($context)` output is appended in resolver
 * priority order (lower first). Duplicates are removed while
 * preserving first-occurrence order.
 *
 * The `$context` map is passed straight through to every
 * resolver — see the {@see \Stackra\Caching\Contracts\CacheTagResolver}
 * docblock for the canonical keys.
 *
 * @see \Stackra\Caching\Registry\CacheTagResolverRegistry Source of the resolver chain.
 * @see \Stackra\Caching\Contracts\CacheTagResolver Resolver contract.
 */

declare(strict_types=1);

namespace Stackra\Caching\Support;

use Stackra\Caching\Registry\CacheTagResolverRegistry;

/**
 * Immutable, injectable tag composer. Consumers keep an instance
 * as `private readonly CacheTagBuilder $cacheTags` and call
 * {@see for()} / {@see forMany()} without worrying about resolver
 * discovery.
 */
final readonly class CacheTagBuilder
{
    /**
     * @param  CacheTagResolverRegistry  $resolvers  Resolver chain populated at boot via `#[AsCacheTagResolver]` discovery.
     * @param  string                    $tagPrefix  Static prefix prepended to every emitted tag. Read from `caching.tag_prefix`.
     */
    public function __construct(
        private CacheTagResolverRegistry $resolvers,
        private string $tagPrefix = '',
    ) {
    }

    /**
     * Compose the tag list for a single table.
     *
     * @param  string                $table    Physical table name.
     * @param  array<string, mixed>  $context  Free-form context passed to every resolver.
     * @return list<string>
     */
    public function for(string $table, array $context = []): array
    {
        $context = ['table' => $table] + $context;

        $tags = [$this->prefixed($table)];

        foreach ($this->resolvers->all() as $resolver) {
            foreach ($resolver->resolve($context) as $segment) {
                $prefixed = $this->prefixed($segment);
                if (! in_array($prefixed, $tags, true)) {
                    $tags[] = $prefixed;
                }
            }
        }

        return $tags;
    }

    /**
     * Compose a de-duplicated tag list spanning multiple tables.
     *
     * Preserves iteration order so the resulting list is stable
     * across runs; that keeps the cache-tag hash deterministic.
     *
     * @param  list<string>          $tables
     * @param  array<string, mixed>  $context
     * @return list<string>
     */
    public function forMany(array $tables, array $context = []): array
    {
        $tags = [];
        foreach ($tables as $table) {
            foreach ($this->for($table, $context) as $tag) {
                if (! in_array($tag, $tags, true)) {
                    $tags[] = $tag;
                }
            }
        }

        return $tags;
    }

    /**
     * Apply the configured static prefix if set. `'stackra'`
     * + `'athletes'` → `'stackra:athletes'`. When no prefix is
     * configured the segment is returned as-is.
     */
    private function prefixed(string $segment): string
    {
        return $this->tagPrefix === '' ? $segment : $this->tagPrefix . ':' . $segment;
    }
}
