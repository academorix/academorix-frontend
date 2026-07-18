<?php

declare(strict_types=1);

namespace Academorix\Application\Policies;

use Academorix\Application\Contracts\Data\BusinessTypeInterface;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Application\Models\BusinessType;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for {@see BusinessType}.
 *
 * Every write denies on `is_system = true` regardless of permission —
 * the seeder is the only sanctioned mutator (paired with the
 * observer's ORM-side guardrail). Tenant customs (`is_system = false`)
 * follow standard permission checks.
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class BusinessTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(ApplicationPermission::BusinessTypeViewAny->value);
    }

    public function view(User $user, BusinessType $type): bool
    {
        return $user->can(ApplicationPermission::BusinessTypeView->value);
    }

    /**
     * Tenant admins may create custom BusinessTypes (`is_system = false`).
     * Platform admins never create system rows via HTTP — only via
     * the seeder. This method covers the tenant-custom path.
     */
    public function create(User $user): bool
    {
        return $user->can(ApplicationPermission::BusinessTypeCreate->value);
    }

    /**
     * Update denies on system rows.
     */
    public function update(User $user, BusinessType $type): bool
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }
        return $user->can(ApplicationPermission::BusinessTypeUpdate->value);
    }

    /**
     * Delete denies on system rows.
     */
    public function delete(User $user, BusinessType $type): bool
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }
        return $user->can(ApplicationPermission::BusinessTypeDelete->value);
    }

    /**
     * Restore mirrors delete — system rows never soft-delete.
     */
    public function restore(User $user, BusinessType $type): bool
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }
        return $user->can(ApplicationPermission::BusinessTypeDelete->value);
    }
}
