<?php

declare(strict_types=1);

namespace Academorix\Versioning\Policies;

use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Enums\VersioningPermission;
use Academorix\Versioning\Models\ApiVersion;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see ApiVersion}.
 *
 * Platform-admin only. Every ability checks the manage-permission
 * except `viewAny`/`view` which fall back to the view-permission.
 * `refusedOnSystemRow` — update / delete / release / deprecate /
 * sunset are refused when `is_system = true` and the caller isn't a
 * super_admin bypassed via `Gate::before`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ApiVersionPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(VersioningPermission::View->value)
            || $user->can(VersioningPermission::Manage->value);
    }

    public function view(Authenticatable $user, ApiVersion $apiVersion): bool
    {
        return $this->viewAny($user);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }

    public function update(Authenticatable $user, ApiVersion $apiVersion): bool
    {
        if ($this->refusedOnSystemRow($apiVersion)) {
            return false;
        }

        return $user->can(VersioningPermission::Manage->value);
    }

    public function delete(Authenticatable $user, ApiVersion $apiVersion): bool
    {
        return $this->update($user, $apiVersion);
    }

    public function release(Authenticatable $user, ApiVersion $apiVersion): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }

    public function deprecate(Authenticatable $user, ApiVersion $apiVersion): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }

    public function sunset(Authenticatable $user, ApiVersion $apiVersion): bool
    {
        return $user->can(VersioningPermission::Manage->value);
    }

    /**
     * Whether the row is system-owned. System rows are refused for
     * update / delete unless the caller is bypassed by `Gate::before`.
     */
    private function refusedOnSystemRow(ApiVersion $apiVersion): bool
    {
        return (bool) $apiVersion->{ApiVersionInterface::ATTR_IS_SYSTEM};
    }
}
