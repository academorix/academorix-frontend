<?php

declare(strict_types=1);

namespace Stackra\Integrations\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Integrations module contributes.
 *
 * Split across the two guards — platform admins view + manage every
 * tenant's integration catalogue; tenant admins manage their own
 * tenant's integrations.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum IntegrationsPermission: string implements PermissionEnum
{
    use Enum;

    #[Label('View Integrations (platform)')]
    #[Description('Read-only access to every tenant integration. `config` is always redacted on the wire.')]
    case View = 'integrations.integration.view';

    #[Label('Manage Integrations (platform)')]
    #[Description('Full lifecycle management of every tenant integration. Platform admins.')]
    case Manage = 'integrations.integration.manage';

    #[Label('Manage Own Integrations')]
    #[Description('Tenant admin manages their own tenant\'s integration credentials.')]
    case ManageOwn = 'integrations.tenant.manage';

    /**
     * The Laravel guard this permission binds to. Platform-catalogue
     * permissions target `platform_admin`; tenant self-service
     * permissions target `sanctum`.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage => Guard::PlatformAdmin,
            self::ManageOwn          => Guard::Sanctum,
        };
    }
}
