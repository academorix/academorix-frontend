<?php

/**
 * @file packages/framework/caching/src/Concerns/InteractsWithCache.php
 *
 * @description
 * Convenience trait for repositories, services, and other
 * long-lived classes that read + write through the cache
 * frequently. Exposes three thin helpers that route every call
 * through {@see \Stackra\Caching\Support\TaggableCacheGuard}
 * and {@see \Stackra\Caching\Support\CacheTagBuilder} so the
 * consumer never touches `Cache::` directly.
 *
 * ## Why a trait
 *
 * A base class would be over-committal — every domain package
 * has its own inheritance hierarchy (`BaseRepository`,
 * `BaseService`, etc.). A trait slots in orthogonally and lets
 * the consumer stay in whatever base class the package requires.
 *
 * ## Wiring
 *
 * The consumer either injects `CacheTagBuilder` and
 * `TaggableCacheGuard` on the constructor and assigns them to
 * the trait's protected properties, OR relies on the
 * `CachingServiceProvider`'s container `resolving()` hook that
 * auto-assigns them for classes that `use InteractsWithCache`
 * (planned; today it's manual).
 *
 * ## Example
 *
 * ```php
 * use Stackra\Caching\Concerns\InteractsWithCache;
 *
 * final class AthleteRepository
 * {
 *     use InteractsWithCache;
 *
 *     public function __construct(
 *         CacheTagBuilder    $cacheTags,
 *         TaggableCacheGuard $cache,
 *     ) {
 *         $this->cacheTags = $cacheTags;
 *         $this->cache     = $cache;
 *     }
 *
 *     public function all(): Collection
 *     {
 *         return $this->cacheRemember('athletes', 'athletes:all',
 *             fn () => Athlete::query()->get(),
 *         );
 *     }
 * }
 * ```
 */

declare(strict_types=1);

namespace Stackra\Caching\Concerns;

use Stackra\Caching\Support\CacheTagBuilder;
use Stackra\Caching\Support\TaggableCacheGuard;
use Closure;

/**
 * Cache read / write helpers backed by the tag builder + guard.
 */
trait InteractsWithCache
{
    /**
     * Tag composer — expected to be assigned by the consumer's
     * constructor or by the `resolving()` hook.
     */
    protected CacheTagBuilder $cacheTags;

    /**
     * Cache driver wrapper — same.
     */
    protected TaggableCacheGuard $cache;

    /**
     * Remember + return a value for `$table`, TTL in seconds.
     *
     * @param  string   $table  Table name; expanded via `cacheTags->for()`.
     * @param  string   $key    Fully-composed cache key.
     * @param  Closure  $factory  Callback invoked on cache miss.
     * @param  int      $ttlSeconds  TTL, defaults to 5 minutes.
     */
    protected function cacheRemember(string $table, string $key, Closure $factory, int $ttlSeconds = 300): mixed
    {
        return $this->cache->remember(
            $this->cacheTags->for($table),
            $key,
            $ttlSeconds,
            $factory,
        );
    }

    /**
     * Forget one key from the cache tag for `$table`.
     */
    protected function cacheForget(string $table, string $key): bool
    {
        return $this->cache->forget(
            $this->cacheTags->for($table),
            $key,
        );
    }

    /**
     * Flush every entry tagged for `$table`.
     */
    protected function cacheFlush(string $table): bool
    {
        return $this->cache->flush(
            $this->cacheTags->for($table),
        );
    }

    /**
     * Flush every entry tagged for a set of tables — used when a
     * single write fans invalidation across multiple entities.
     *
     * @param  list<string>  $tables
     */
    protected function cacheFlushMany(array $tables): bool
    {
        return $this->cache->flush(
            $this->cacheTags->forMany($tables),
        );
    }
}
