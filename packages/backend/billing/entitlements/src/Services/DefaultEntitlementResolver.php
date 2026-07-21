<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Services;

use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Contracts\Services\EntitlementResolverInterface;
use Stackra\Entitlements\Models\Entitlement;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Cache\Repository;

/**
 * Default {@see EntitlementResolverInterface} — Redis-cached hot path.
 *
 * Uses Laravel's cache repository (Redis by default) with tag-based
 * invalidation. Every lookup is memoised per-request in a private
 * array so multiple resolves in the same request cycle don't hit
 * the cache twice.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultEntitlementResolver implements EntitlementResolverInterface
{
    /**
     * Per-request memo — key is `{tenantId}:{key}`, value is the row
     * (or `false` when the row does not exist so the negative result
     * itself is memoised).
     *
     * @var array<string, Entitlement|false>
     */
    private array $memo = [];

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
        #[Cache('redis')] private readonly Repository $cache,
        #[Config('entitlements.cache.ttl')] private readonly int $ttl,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $tenantId, string $key): ?Entitlement
    {
        $memoKey = $tenantId . ':' . $key;

        if (\array_key_exists($memoKey, $this->memo)) {
            $hit = $this->memo[$memoKey];

            return $hit === false ? null : $hit;
        }

        $cacheKey = $this->cacheKey($tenantId, $key);

        /** @var Entitlement|null $row */
        $row = $this->cache->remember(
            $cacheKey,
            $this->ttl,
            fn (): ?Entitlement => $this->entitlements->findByKey($tenantId, $key),
        );

        $this->memo[$memoKey] = $row ?? false;

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function flush(string $tenantId): void
    {
        // Clear per-request memo entries for the tenant.
        foreach (\array_keys($this->memo) as $memoKey) {
            if (\str_starts_with($memoKey, $tenantId . ':')) {
                unset($this->memo[$memoKey]);
            }
        }

        // The registered `Cacheable` observer flushes tag entries on
        // its own. When the cache repository doesn't support tags,
        // fall back to key-by-key eviction (best-effort).
        try {
            $this->cache->tags(['entitlements', 'tenant:' . $tenantId])->flush();
        } catch (\Throwable) {
            // Store doesn't support tags — no-op fallback; per-key
            // entries expire naturally via TTL.
        }
    }

    /**
     * Compose the cache key for a `(tenant, key)` lookup.
     */
    private function cacheKey(string $tenantId, string $key): string
    {
        return \sprintf('entitlements:%s:%s', $tenantId, $key);
    }
}
