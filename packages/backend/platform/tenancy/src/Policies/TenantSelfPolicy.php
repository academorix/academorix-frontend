<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Policies;

use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Tenant-self authorization policy — a tenant admin editing their
 * OWN tenant via `PATCH /api/current-tenant`.
 *
 * Targets the `sanctum` guard. The `updateOwn` ability additionally
 * requires the caller's own `tenant_id` to match the tenant being
 * updated — cross-tenant writes refuse.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantSelfPolicy
{
    /**
     * `updateOwn` — the caller updates their own tenant.
     *
     * Requires the `tenancy.tenant.manage_own_settings` permission
     * AND the caller's `tenant_id` to match the target tenant.
     */
    public function updateOwn(Authenticatable $user, Tenant $tenant): bool
    {
        if (! $user->can(TenancyPermission::ManageOwnSettings->value)) {
            return false;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId) && $callerTenantId === $tenant->getKey();
    }
}
