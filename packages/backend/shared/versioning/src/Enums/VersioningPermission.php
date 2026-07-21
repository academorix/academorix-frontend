<?php

declare(strict_types=1);

namespace Stackra\Versioning\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Versioning module contributes.
 *
 * Both cases are platform-admin scoped — versioning is a
 * platform-owned concern. Tenant-side reads are unauthenticated
 * (public catalog surface) so they need no permission.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum VersioningPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `versioning.version.view` — read-only access to every ApiVersion
     * + DeprecationNotice, including drafts + sunsets.
     */
    #[Label('View API Versions (platform)')]
    #[Description('Read-only access to every ApiVersion and DeprecationNotice including drafts and sunsets.')]
    case View = 'versioning.version.view';

    /**
     * `versioning.version.manage` — full lifecycle control: create /
     * update / release / deprecate / sunset ApiVersions; create /
     * publish / delete DeprecationNotices.
     */
    #[Label('Manage API Versions (platform)')]
    #[Description('Full lifecycle control of every ApiVersion — create, release, deprecate, sunset — and every DeprecationNotice.')]
    case Manage = 'versioning.version.manage';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage => Guard::PlatformAdmin,
        };
    }
}
