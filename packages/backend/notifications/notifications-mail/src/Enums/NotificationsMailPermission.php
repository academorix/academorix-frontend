<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the notifications-mail module contributes.
 *
 * Per blueprint `permissions.json`, four permissions govern the
 * tenant admin surface for the mail suppression list. Provider
 * webhook receivers bypass auth entirely — the signature IS the
 * credential.
 *
 * All permissions bind to the `sanctum` guard (tenant users);
 * platform staff receive the same grants via
 * `Gate::before`-driven super_admin bypass.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/permissions.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationsMailPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `notifications.mail.suppressions.viewAny` — list suppressions
     * in the tenant. Seeded on `admin` + `owner` roles.
     */
    #[Label('List Mail Suppressions')]
    #[Description('List mail suppression rows within the tenant.')]
    case SuppressionsViewAny = 'notifications.mail.suppressions.viewAny';

    /**
     * `notifications.mail.suppressions.view` — read a single row.
     * Seeded on `admin` + `owner` roles.
     */
    #[Label('View Mail Suppression')]
    #[Description('View a single mail suppression row.')]
    case SuppressionsView = 'notifications.mail.suppressions.view';

    /**
     * `notifications.mail.suppressions.create` — manually add an
     * address (reason=manual). Seeded on `admin` + `owner` roles.
     */
    #[Label('Create Mail Suppression')]
    #[Description('Manually block an email address for the tenant (reason=manual).')]
    case SuppressionsCreate = 'notifications.mail.suppressions.create';

    /**
     * `notifications.mail.suppressions.delete` — revoke a
     * suppression. Refused for hard_bounce / complaint / spam_trap
     * rows by the policy unless `--force` + super_admin. Seeded on
     * `owner` role only.
     */
    #[Label('Delete Mail Suppression')]
    #[Description('Revoke a mail suppression. Refused for hard_bounce / complaint / spam_trap rows unless --force + super_admin.')]
    case SuppressionsDelete = 'notifications.mail.suppressions.delete';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::SuppressionsViewAny,
            self::SuppressionsView,
            self::SuppressionsCreate,
            self::SuppressionsDelete => Guard::Sanctum,
        };
    }
}
