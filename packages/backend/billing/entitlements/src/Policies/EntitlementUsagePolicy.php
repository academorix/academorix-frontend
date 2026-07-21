<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Policies;

use Stackra\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Models\EntitlementUsage;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see EntitlementUsage}.
 *
 * Read-only — usage rows are append-only + system-managed. Tenant
 * admins see their own tenant's rows; platform admins see everyone.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementUsagePolicy
{
    /**
     * Whether the caller can list usage rows.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(EntitlementsPermission::View->value)
            || $user->can(EntitlementsPermission::ViewAll->value)
            || $user->can(EntitlementsPermission::Manage->value);
    }

    /**
     * Whether the caller can view a specific usage row.
     */
    public function view(Authenticatable $user, EntitlementUsage $usage): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $usage);
    }

    /**
     * Platform admins bypass; tenant admins must match tenant.
     */
    private function belongsToCaller(Authenticatable $user, EntitlementUsage $usage): bool
    {
        if (
            $user->can(EntitlementsPermission::ViewAll->value)
            || $user->can(EntitlementsPermission::Manage->value)
        ) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $usage->{EntitlementUsageInterface::ATTR_TENANT_ID};
    }
}
