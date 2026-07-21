<?php

declare(strict_types=1);

namespace Stackra\Storage\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Storage module contributes.
 *
 * Split across the two guards — platform staff view + manage every
 * file across every tenant; tenant admins manage + upload files
 * inside their own tenant.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum StoragePermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `storage.file.view` — list + read every file across every
     * tenant. Platform staff only.
     */
    #[Label('View Files (platform)')]
    #[Description('Read-only access to every file across every tenant. Platform staff.')]
    case View = 'storage.file.view';

    /**
     * `storage.file.manage` — full lifecycle (quarantine / rescan /
     * force-delete) on every file. Platform admins.
     */
    #[Label('Manage Files (platform)')]
    #[Description('Quarantine, rescan, and force-delete every file. Platform admins.')]
    case Manage = 'storage.file.manage';

    /**
     * `storage.tenant.manage` — tenant admin manages files owned by
     * their tenant: list, update, delete, signed URLs.
     */
    #[Label('Manage Own Files')]
    #[Description('Tenant admin manages files owned by their tenant.')]
    case ManageOwn = 'storage.tenant.manage';

    /**
     * `storage.tenant.upload` — tenant user uploads files against
     * the tenant's quota.
     */
    #[Label('Upload Files')]
    #[Description('Upload files against the tenant quota.')]
    case Upload = 'storage.tenant.upload';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage       => Guard::PlatformAdmin,
            self::ManageOwn, self::Upload  => Guard::Sanctum,
        };
    }
}
