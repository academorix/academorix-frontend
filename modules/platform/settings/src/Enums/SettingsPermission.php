<?php

declare(strict_types=1);

namespace Academorix\Settings\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the Settings module contributes.
 *
 * Dual-guard split — platform admins view + manage every system-scope
 * value; tenant admins manage their own tenant's overrides.
 *
 * ## Cases
 *
 *  * {@see self::View}       — platform read of every setting.
 *  * {@see self::Manage}     — platform full lifecycle over system-scope values.
 *  * {@see self::ManageOwn}  — tenant admin manages tenant-scope overrides.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SettingsPermission: string implements PermissionEnum
{
    use Enum;

    #[Label('View Settings (platform)')]
    #[Description('Read-only access to every settings group across every tenant.')]
    case View = 'settings.settings.view';

    #[Label('Manage Settings (platform)')]
    #[Description('Full lifecycle management of system-scope settings. Platform admins.')]
    case Manage = 'settings.settings.manage';

    #[Label('Manage Own Settings')]
    #[Description('Tenant admin manages their own tenant\'s settings overrides.')]
    case ManageOwn = 'settings.tenant.manage';

    /**
     * Which guard this permission resolves under.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage => Guard::PlatformAdmin,
            self::ManageOwn          => Guard::Sanctum,
        };
    }
}
