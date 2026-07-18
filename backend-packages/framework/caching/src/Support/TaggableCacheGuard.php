<?php

/**
 * @file packages/framework/caching/src/Support/TaggableCacheGuard.php
 *
 * @description
 * Cache facade wrapper that transparently degrades tag-based
 * operations when the active driver doesn't support tags.
 *
 * ## Why we need a guard
 *
 * Tag-based invalidation is the enterprise workhorse — a single
 * `Cache::tags([...])->flush()` clears every entry that shared
 * those tags in one call. But only Redis and Memcached support
 * tags natively. Array, file, and database drivers throw
 * `BadMethodCallException` on any `->tags()` chain.
 *
 * `TaggableCacheGuard` reads the driver's capability once via
 * a `method_exists()` probe on the store and picks the right
 * path:
 *
 *   - **Tagged store (Redis / Memcached)**: forwards to
 *     `Cache::tags($tags)->…()`.
 *   - **Untagged store (array / file / db)**: falls back to the
 *     plain `Cache::…()` chain and silently no-ops on `flush()`.
 *
 * ## Fail-open by default
 *
 * The `caching.fail_open_untagged` config flag (default `true`)
 * controls whether an unsupported operation degrades silently
 * (production Redis) or throws (dev / CI catching misconfigured
 * drivers). Every production deployment MUST run a tag-capable
 * driver; the fail-open path only exists so PHPUnit runs on the
 * array driver don't crash.
 *
 * ## Constructor injection
 *
 * The guard has no state of its own — the driver check is
 * repeated every call. Under Octane the container binds the
 * guard as a `#[Singleton]` so one instance serves every worker
 * request; the driver read is cheap (a `method_exists()`).
 */

declare(strict_types=1);

namespace Academorix\Caching\Support;

use Closure;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Cache;

/**
 * Wraps `Illuminate\Support\Facades\Cache` with a tag-capability
 * guard. Callers pass `list<string>` tags to every method; the
 * guard picks the right underlying chain.
 */
final class TaggableCacheGuard
{
    /**
     * @param  bool  $failOpen
     *   When `true`, unsupported tag operations fall back to the
     *   untagged path silently. When `false`, they throw so
     *   test suites catch mis-configured drivers. Bound at boot
     *   from the `caching.fail_open_untagged` config value.
     */
    public function __construct(
        private readonly bool $failOpen = true,
    ) {
    }

    /**
     * Remember-and-return a value under a tagged key.
     *
     * @param  list<string>  $tags        Tag chain applied when the driver supports it.
     * @param  string        $key         Fully-composed cache key.
     * @param  int           $ttlSeconds  TTL in seconds; `0` = never expire.
     * @param  Closure       $callback    Factory invoked on cache miss.
     */
    public function remember(array $tags, string $key, int $ttlSeconds, Closure $callback): mixed
    {
        return $this->store($tags)->remember($key, $ttlSeconds, $callback);
    }

    /**
     * Fetch a value without a factory. Returns `null` on miss.
     *
     * @param  list<string>  $tags
     */
    public function get(array $tags, string $key): mixed
    {
        return $this->store($tags)->get($key);
    }

    /**
     * Write a value under the given tag chain.
     *
     * @param  list<string>  $tags
     */
    public function put(array $tags, string $key, mixed $value, int $ttlSeconds): bool
    {
        return $this->store($tags)->put($key, $value, $ttlSeconds);
    }

    /**
     * Forget a single tagged key.
     *
     * @param  list<string>  $tags
     */
    public function forget(array $tags, string $key): bool
    {
        return $this->store($tags)->forget($key);
    }

    /**
     * Flush every entry carrying any of the given tags.
     *
     * No-op on untagged drivers when `$failOpen` is `true`.
     *
     * @param  list<string>  $tags
     */
    public function flush(array $tags): bool
    {
        try {
            if ($this->supportsTags()) {
                Cache::tags($tags)->flush();

                return true;
            }
        } catch (\Throwable $throwable) {
            if (! $this->failOpen) {
                throw $throwable;
            }
        }

        return false;
    }

    /**
     * True when the active cache driver supports tags. Read once
     * per call so a live driver swap in-request is respected.
     */
    public function supportsTags(): bool
    {
        try {
            return method_exists(Cache::getStore(), 'tags');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Pick the concrete repository chain — tagged when supported,
     * plain when not. Kept private so callers always route through
     * the public methods above and inherit the fail-open logic.
     *
     * @param  list<string>  $tags
     */
    private function store(array $tags): CacheRepository
    {
        try {
            if ($this->supportsTags()) {
                return Cache::tags($tags);
            }
        } catch (\Throwable $throwable) {
            if (! $this->failOpen) {
                throw $throwable;
            }
        }

        return Cache::store();
    }
}
