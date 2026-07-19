<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Concerns;

use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Models\Entitlement;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Mixed into the Tenant model.
 *
 * Adds the `entitlements()` relation and the `entitlementFor($key)`
 * accessor. The relation is the canonical way for tenant-scoped code
 * to load an entitlement without going through the resolver — the
 * resolver adds caching + fallback logic; the relation returns the
 * raw row.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
trait HasEntitlements
{
    /**
     * Every entitlement owned by this tenant.
     *
     * @return HasMany<Entitlement, $this>
     */
    public function entitlements(): HasMany
    {
        return $this->hasMany(
            Entitlement::class,
            EntitlementInterface::ATTR_TENANT_ID,
            $this->getKeyName(),
        );
    }

    /**
     * Look up a single entitlement by key. Returns null when the
     * tenant has no entitlement for `$key`.
     *
     * @param  string  $key  Dot-separated identifier.
     */
    public function entitlementFor(string $key): ?Entitlement
    {
        /** @var Entitlement|null $entitlement */
        $entitlement = $this->entitlements()
            ->where(EntitlementInterface::ATTR_KEY, $key)
            ->first();

        return $entitlement;
    }
}
