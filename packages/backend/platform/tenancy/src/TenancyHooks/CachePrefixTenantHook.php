<?php

declare(strict_types=1);

namespace Stackra\Tenancy\TenancyHooks;

use Stackra\ServiceProvider\Attributes\AsTenancyHook;
use Stackra\ServiceProvider\Contracts\TenancyHookInterface;
use Stackra\ServiceProvider\Support\TenantHookContext;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Cache\CacheManager;

/**
 * Set the cache repository prefix to `tenant:{tenant_id}:` so every
 * cache read/write is namespaced. Prevents accidental cross-tenant
 * cache reads.
 *
 * Octane-safe — `onTenantEnded` restores the previous prefix.
 *
 * Priority 20 — framework-level, runs after log-context (10).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsTenancyHook(priority: 20)]
final class CachePrefixTenantHook implements TenancyHookInterface
{
    /**
     * @var string|null  Snapshot of the previous cache prefix.
     */
    private ?string $previousPrefix = null;

    /**
     * {@inheritDoc}
     */
    public function onTenantInitialized(TenantHookContext $ctx): void
    {
        if (! $ctx->tenant instanceof Tenant) {
            return;
        }

        try {
            /** @var CacheManager $cache */
            $cache = $ctx->container->make(CacheManager::class);
            $store = $cache->store();
        } catch (\Throwable) {
            return;
        }

        if (! \method_exists($store, 'getPrefix') || ! \method_exists($store, 'setPrefix')) {
            return;
        }

        $this->previousPrefix = (string) $store->getPrefix();
        $store->setPrefix('tenant:' . $ctx->tenant->getKey() . ':');
    }

    /**
     * {@inheritDoc}
     */
    public function onTenantEnded(TenantHookContext $ctx): void
    {
        if ($this->previousPrefix === null) {
            return;
        }

        try {
            /** @var CacheManager $cache */
            $cache = $ctx->container->make(CacheManager::class);
            $store = $cache->store();
        } catch (\Throwable) {
            $this->previousPrefix = null;

            return;
        }

        if (\method_exists($store, 'setPrefix')) {
            $store->setPrefix($this->previousPrefix);
        }

        $this->previousPrefix = null;
    }
}
