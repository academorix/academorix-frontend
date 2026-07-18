<?php

declare(strict_types=1);

namespace Academorix\Storage\Policies;

use Academorix\Storage\Contracts\Data\FileVariantInterface;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\FileVariant;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Read-only authorization policy for {@see FileVariant}.
 *
 * Variants are regenerable — writes always go through the parent
 * File. This policy governs read visibility only.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileVariantPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(StoragePermission::View->value)
            || $user->can(StoragePermission::Manage->value)
            || $user->can(StoragePermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, FileVariant $variant): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $variant);
    }

    private function belongsToCaller(Authenticatable $user, FileVariant $variant): bool
    {
        if ($user->can(StoragePermission::Manage->value) || $user->can(StoragePermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $variant->{FileVariantInterface::ATTR_TENANT_ID};
    }
}
