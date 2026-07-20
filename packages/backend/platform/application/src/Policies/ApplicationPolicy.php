<?php

declare(strict_types=1);

namespace Academorix\Application\Policies;

use Academorix\Application\Contracts\Data\ApplicationInterface;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Application\Models\Application;
use Illuminate\Foundation\Auth\User;

/**
 * Authorization policy for {@see Application}.
 *
 * Wired via `#[UsePolicy(ApplicationPolicy::class)]` on the model.
 * Every method returns `false` for `is_system = true` rows regardless
 * of the actor's permissions — the seeder is the only sanctioned
 * mutator, aligned with the observer guardrail.
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class ApplicationPolicy
{
    /**
     * Anyone with `applications.view-any` may list. Public on the
     * central host (guest allowed via middleware); scoped on
     * platform-admin.
     */
    public function viewAny(User $user): bool
    {
        return $user->can(ApplicationPermission::ViewAny->value);
    }

    /**
     * Same rule as viewAny — the resource is public metadata.
     */
    public function view(User $user, Application $application): bool
    {
        return $user->can(ApplicationPermission::View->value);
    }

    public function create(User $user): bool
    {
        return $user->can(ApplicationPermission::Create->value);
    }

    /**
     * System rows refuse regardless of permission.
     */
    public function update(User $user, Application $application): bool
    {
        if ($application->{ApplicationInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }
        return $user->can(ApplicationPermission::Update->value);
    }

    public function delete(User $user, Application $application): bool
    {
        if ($application->{ApplicationInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }
        return $user->can(ApplicationPermission::Delete->value);
    }

    /**
     * Restore mirrors delete — system rows never soft-delete in the
     * first place, but the check is here for defence in depth.
     */
    public function restore(User $user, Application $application): bool
    {
        if ($application->{ApplicationInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }
        return $user->can(ApplicationPermission::Delete->value);
    }
}
