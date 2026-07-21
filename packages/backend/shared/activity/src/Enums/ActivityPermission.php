<?php

declare(strict_types=1);

namespace Stackra\Activity\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Activity module contributes.
 *
 * Split across the two guards — tenant users read their own tenant's
 * feed via `sanctum`; platform admins search cross-tenant via
 * `platform_admin`. Same permission model as the rest of the
 * observability surface.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ActivityPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `activity.activity.view` — tenant user reads their own tenant's
     * activity feed. Regular users see their own causer feed; tenant
     * admins see the tenant-wide feed (filtered by policy).
     */
    #[Label('View Activity Feed')]
    #[Description('Read the tenant\'s activity feed. Regular users see their own causer entries; admins see the tenant-wide feed.')]
    case View = 'activity.activity.view';

    /**
     * `activity.activity.view_all` — platform admin reads across every
     * tenant for incident triage.
     */
    #[Label('View Activity Feed (Platform)')]
    #[Description('Cross-tenant read-only access to the activity feed. Platform support staff for incident triage.')]
    case ViewAll = 'activity.activity.view_all';

    /**
     * The Laravel guard this permission binds to. Tenant view targets
     * `sanctum`; platform-admin cross-tenant view targets
     * `platform_admin`.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View    => Guard::Sanctum,
            self::ViewAll => Guard::PlatformAdmin,
        };
    }
}
