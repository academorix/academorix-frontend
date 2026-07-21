<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Policies;

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Models\Entitlement;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Entitlement}.
 *
 * Dual-guard — platform admins have read across every tenant +
 * write for overrides + resets; tenant admins see their own tenant's
 * entitlements read-only.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementPolicy
{
    /**
     * Whether the caller can list entitlements at all.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(EntitlementsPermission::View->value)
            || $user->can(EntitlementsPermission::ViewAll->value)
            || $user->can(EntitlementsPermission::Manage->value);
    }

    /**
     * Whether the caller can view a specific entitlement row.
     */
    public function view(Authenticatable $user, Entitlement $entitlement): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $entitlement);
    }

    /**
     * Overrides + resets + syncs — platform admins only.
     */
    public function update(Authenticatable $user, Entitlement $entitlement): bool
    {
        return $user->can(EntitlementsPermission::Manage->value);
    }

    /**
     * Platform admins can trigger a period reset.
     */
    public function reset(Authenticatable $user, Entitlement $entitlement): bool
    {
        return $user->can(EntitlementsPermission::Manage->value);
    }

    /**
     * Platform admins bypass tenant scope; tenant admins must match
     * the row's `tenant_id`.
     */
    private function belongsToCaller(Authenticatable $user, Entitlement $entitlement): bool
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
            && $callerTenantId === $entitlement->{EntitlementInterface::ATTR_TENANT_ID};
    }
}
