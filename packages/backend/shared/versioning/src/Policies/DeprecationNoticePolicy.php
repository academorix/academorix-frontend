<?php

declare(strict_types=1);

namespace Stackra\Versioning\Policies;

use Stackra\Versioning\Enums\VersioningPermission;
use Stackra\Versioning\Models\DeprecationNotice;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see DeprecationNotice}.
 *
 * Platform-admin only. Update / delete are refused on active notices
 * (append-only after publish) unless the caller is a super_admin via
 * `Gate::before`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class DeprecationNoticePolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(VersioningPermission::View->value)
            || $user->can(VersioningPermission::Manage->value);
    }

    public function view(Authenticatable $user, DeprecationNotice $notice): bool
    {
        return $this->viewAny($user);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }

    public function update(Authenticatable $user, DeprecationNotice $notice): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }

    public function delete(Authenticatable $user, DeprecationNotice $notice): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }
}
