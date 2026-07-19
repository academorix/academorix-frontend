<?php

declare(strict_types=1);

namespace Academorix\Storage\Policies;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\File;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see File}.
 *
 * Dual-guard — platform admins with `storage.file.manage` or
 * `storage.file.view`, OR tenant admins with
 * `storage.tenant.manage` / `storage.tenant.upload` on their own
 * tenant.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FilePolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(StoragePermission::View->value)
            || $user->can(StoragePermission::Manage->value)
            || $user->can(StoragePermission::ManageOwn->value)
            || $user->can(StoragePermission::Upload->value);
    }

    public function view(Authenticatable $user, File $file): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $file);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(StoragePermission::Manage->value)
            || $user->can(StoragePermission::ManageOwn->value)
            || $user->can(StoragePermission::Upload->value);
    }

    public function update(Authenticatable $user, File $file): bool
    {
        return $this->create($user) && $this->belongsToCaller($user, $file);
    }

    public function delete(Authenticatable $user, File $file): bool
    {
        return $this->update($user, $file);
    }

    /**
     * `quarantine` — platform-only, sets `virus_scan_state` to
     * `quarantined` by admin override.
     */
    public function quarantine(Authenticatable $user, File $file): bool
    {
        return $user->can(StoragePermission::Manage->value);
    }

    /**
     * `rescan` — platform-only, re-dispatches
     * {@see \Academorix\Storage\Jobs\ScanFileForVirusesJob}.
     */
    public function rescan(Authenticatable $user, File $file): bool
    {
        return $user->can(StoragePermission::Manage->value);
    }

    /**
     * Tenant admins may only touch files belonging to their own
     * tenant. Platform admins bypass the check.
     */
    private function belongsToCaller(Authenticatable $user, File $file): bool
    {
        if ($user->can(StoragePermission::Manage->value) || $user->can(StoragePermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $file->{FileInterface::ATTR_TENANT_ID};
    }
}
