<?php

declare(strict_types=1);

namespace Academorix\Storage\Policies;

use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\ChunkedUpload;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see ChunkedUpload}.
 *
 * Dual-guard, tenant-match on view / update / abort. Only the
 * upload's owner (or platform staff) can inspect an in-flight
 * upload.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class ChunkedUploadPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(StoragePermission::Upload->value)
            || $user->can(StoragePermission::ManageOwn->value)
            || $user->can(StoragePermission::Manage->value);
    }

    public function view(Authenticatable $user, ChunkedUpload $upload): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $upload);
    }

    public function update(Authenticatable $user, ChunkedUpload $upload): bool
    {
        return $this->view($user, $upload);
    }

    public function delete(Authenticatable $user, ChunkedUpload $upload): bool
    {
        return $this->view($user, $upload);
    }

    private function belongsToCaller(Authenticatable $user, ChunkedUpload $upload): bool
    {
        if ($user->can(StoragePermission::Manage->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $upload->{ChunkedUploadInterface::ATTR_TENANT_ID};
    }
}
