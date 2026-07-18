<?php

declare(strict_types=1);

namespace Academorix\Branding\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the Branding module contributes.
 *
 * Split across the two guards — platform admins view every branding
 * profile; tenant admins manage their own tenant's.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BrandingPermission: string implements PermissionEnum
{
    use Enum;

    #[Label('View Brandings (platform)')]
    #[Description('Read-only access to every branding profile across every tenant.')]
    case View = 'branding.branding.view';

    #[Label('Manage Brandings (platform)')]
    #[Description('Full lifecycle management of every branding profile. Platform admins.')]
    case Manage = 'branding.branding.manage';

    #[Label('Manage Own Branding')]
    #[Description('Tenant admin manages their own tenant\'s branding profiles.')]
    case ManageOwn = 'branding.tenant.manage';

    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage => Guard::PlatformAdmin,
            self::ManageOwn          => Guard::Sanctum,
        };
    }
}
