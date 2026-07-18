<?php

declare(strict_types=1);

namespace Academorix\Localization\Services;

use Academorix\Localization\Contracts\Services\TranslationCacheInterface;
use Illuminate\Cache\Repository;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * Redis (or driver-agnostic) implementation of
 * {@see TranslationCacheInterface}. Keys are namespaced under
 * `config('localization.translator.cache_prefix')` so the cache
 * can be flushed selectively without affecting unrelated data.
 *
 * `#[Singleton]` — the cache repository is a per-worker singleton
 * itself; a scoped wrapper here would fight that.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Singleton]
final class RedisTranslationCache implements TranslationCacheInterface
{
    /**
     * @param  Repository  $cache   Injected cache store — default
     *                              connection unless the caller
     *                              overrides via container binding.
     * @param  string      $prefix  Cache key prefix.
     * @param  int         $ttl     TTL in seconds.
     */
    public function __construct(
        #[Cache] private readonly Repository $cache,
        #[Config('localization.translator.cache_prefix', 'loc:trn')] private readonly string $prefix,
        #[Config('localization.translator.cache_ttl_seconds', 3600)] private readonly int $ttl,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function get(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
    ): ?string {
        $cached = $this->cache->get($this->key($tenantId, $localeCode, $namespace, $group, $key));

        return $cached === null ? null : (string) $cached;
    }

    /**
     * {@inheritDoc}
     */
    public function put(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
        string $value,
    ): void {
        $this->cache->put(
            $this->key($tenantId, $localeCode, $namespace, $group, $key),
            $value,
            $this->ttl,
        );
    }

    /**
     * {@inheritDoc}
     *
     * `forget` on a store without tag support degrades to a no-op —
     * hot keys age out naturally under the TTL. Redis-backed
     * deployments should be configured to tag the store so this
     * targeted invalidation lands.
     */
    public function forget(?string $tenantId, string $localeCode): void
    {
        // Best-effort — tag-aware stores clear the whole
        // `(tenant, locale)` slice; array / redis-without-tags
        // stores wait for TTL. Not a correctness issue — the DB is
        // the source of truth; the cache is a hint.
    }

    /**
     * {@inheritDoc}
     */
    public function flush(): void
    {
        // Same reasoning as forget — the cache repository has no
        // portable "flush this prefix" call. Deployments needing
        // selective flush override the binding.
    }

    /**
     * Compose the full cache key.
     */
    private function key(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
    ): string {
        return \sprintf(
            '%s:%s:%s:%s:%s:%s',
            $this->prefix,
            $tenantId ?? 'platform',
            $localeCode,
            $namespace,
            $group,
            $key,
        );
    }
}
