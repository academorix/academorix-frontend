<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Contracts\Services;

use Academorix\Entitlements\Models\Entitlement;
use Academorix\Entitlements\Services\DefaultEntitlementResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Resolve the effective entitlement for a `(tenant_id, key)` tuple.
 *
 * The hot-path lookup — every metered call routes through the resolver
 * before doing work. The default implementation caches the lookup for
 * `entitlements.cache.ttl` seconds; the observer flushes the tenant
 * tag on writes so overrides + plan syncs propagate immediately.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(DefaultEntitlementResolver::class)]
interface EntitlementResolverInterface
{
    /**
     * Look up the entitlement for `(tenant_id, key)`.
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $key       Dot-separated identifier.
     * @return Entitlement|null   The row, or null when the caller has no entitlement for `$key`.
     */
    public function resolve(string $tenantId, string $key): ?Entitlement;

    /**
     * Flush the cached lookup for one tenant. Called by the observer
     * on entitlement writes.
     */
    public function flush(string $tenantId): void;
}
