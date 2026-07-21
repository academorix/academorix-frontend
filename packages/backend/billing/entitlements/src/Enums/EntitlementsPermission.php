<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Entitlements module contributes.
 *
 * Split across the two guards — platform admins view + manage every
 * entitlement (including issuing enterprise-contract overrides);
 * tenant admins only see their own tenant's entitlements read-only.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum EntitlementsPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `entitlements.entitlement.view` — tenant admin reads own tenant's
     * entitlements + usage. Sanctum guard.
     */
    #[Label('View Own Entitlements')]
    #[Description('Read own tenant\'s entitlements + usage history. Read-only — values are plan-derived + platform-managed.')]
    case View = 'entitlements.entitlement.view';

    /**
     * `entitlements.entitlement.view_all` — platform admin reads every
     * tenant's entitlements + usage cross-tenant. Platform_admin guard.
     */
    #[Label('View All Entitlements (platform)')]
    #[Description('Read-only cross-tenant access to every entitlement + usage row. Granted to platform support + ops staff.')]
    case ViewAll = 'entitlements.entitlement.view_all';

    /**
     * `entitlements.entitlement.manage` — platform admin issues enterprise
     * overrides + resets + plan syncs. Platform_admin guard.
     */
    #[Label('Manage Entitlements (platform)')]
    #[Description('Issue enterprise-contract overrides, reset periodic usage, trigger plan syncs. Every write produces a compliance audit row.')]
    case Manage = 'entitlements.entitlement.manage';

    /**
     * The Laravel guard this permission binds to. `View` targets the
     * tenant-facing sanctum guard; `ViewAll` + `Manage` target the
     * platform-admin guard.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View               => Guard::Sanctum,
            self::ViewAll, self::Manage => Guard::PlatformAdmin,
        };
    }
}
