<?php

declare(strict_types=1);

namespace Academorix\Domains\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the Domains module contributes.
 *
 * Split across the two guards — platform staff manage the whole
 * catalogue; tenant admins manage their own tenant's domains.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DomainsPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `domains.domain.view` — list + read every domain across every
     * tenant. Platform staff only.
     */
    #[Label('View Domains (platform)')]
    #[Description('Read-only access to every domain across every tenant. Platform staff.')]
    case View = 'domains.domain.view';

    /**
     * `domains.domain.manage` — full CRUD on every domain. Platform admins.
     */
    #[Label('Manage Domains (platform)')]
    #[Description('Full lifecycle management of every domain. Platform admins.')]
    case Manage = 'domains.domain.manage';

    /**
     * `domains.tenant.manage` — tenant admin manages their own tenant's
     * domains: add, verify, remove. Sanctum guard.
     */
    #[Label('Manage Own Domains')]
    #[Description('Tenant admin adds + verifies + removes their own tenant domains.')]
    case ManageOwn = 'domains.tenant.manage';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage => Guard::PlatformAdmin,
            self::ManageOwn          => Guard::Sanctum,
        };
    }
}
