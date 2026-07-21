<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Policies;

use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Tenant}.
 *
 * Targets the `platform_admin` guard — every ability requires the
 * `tenancy.tenant.view` or `tenancy.tenant.manage` permission. System
 * rows (`is_system = true`) refuse write actions regardless of the
 * caller's permissions.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantPolicy
{
    /**
     * `viewAny` — list Tenants. Requires View OR Manage.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(TenancyPermission::View->value)
            || $user->can(TenancyPermission::Manage->value);
    }

    /**
     * `view` — read one Tenant.
     */
    public function view(Authenticatable $user, Tenant $tenant): bool
    {
        return $this->viewAny($user);
    }

    /**
     * `create` — provision a Tenant.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(TenancyPermission::Manage->value);
    }

    /**
     * `update` — modify a Tenant. System rows refuse.
     */
    public function update(Authenticatable $user, Tenant $tenant): bool
    {
        if ($tenant->{TenantInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(TenancyPermission::Manage->value);
    }

    /**
     * `delete` — archive a Tenant. System rows refuse.
     */
    public function delete(Authenticatable $user, Tenant $tenant): bool
    {
        if ($tenant->{TenantInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(TenancyPermission::Manage->value);
    }

    /**
     * `suspend` — suspend a Tenant. System rows refuse.
     */
    public function suspend(Authenticatable $user, Tenant $tenant): bool
    {
        if ($tenant->{TenantInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(TenancyPermission::Manage->value);
    }

    /**
     * `resume` — resume a suspended Tenant.
     */
    public function resume(Authenticatable $user, Tenant $tenant): bool
    {
        return $user->can(TenancyPermission::Manage->value);
    }

    /**
     * `archive` — archive a Tenant (soft-delete + status transition).
     */
    public function archive(Authenticatable $user, Tenant $tenant): bool
    {
        return $this->delete($user, $tenant);
    }
}
