<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the notifications-in-app module contributes.
 *
 * Per blueprint `permissions.json`, the transport reuses the base
 * `notifications.viewOwn` + `notifications.markRead` permissions for
 * the bell UX — tenant users read + mark-read their own deliveries
 * through routes declared by this module. This enum exists as a
 * MARKER + carries a single admin-view permission for the future
 * transport diagnostics surface; the seeder projects it into
 * spatie's `permissions` table so a downstream admin can grant it.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/permissions.json
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationsInAppPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `notifications.in_app.admin.view` — read-only access to the
     * transport diagnostics surface (delivery rows across the tenant,
     * broadcast health, unread-count integrity checks). Tenant admins
     * only.
     */
    #[Label('View In-App Transport Diagnostics')]
    #[Description('Tenant admin reads transport-level diagnostics for the in-app channel — delivery rows, broadcast health, unread-count integrity.')]
    case AdminView = 'notifications.in_app.admin.view';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::AdminView => Guard::Sanctum,
        };
    }
}
