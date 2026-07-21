<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the notifications-push module contributes.
 *
 * Split across the two guards — tenant users register + revoke their own push
 * devices via `sanctum`; platform staff have cross-tenant read via
 * `platform_admin` (the `device_token` field is still hidden regardless of
 * caller).
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationsPushPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * List push subscriptions. Regular users see their own; tenant admins
     * see every subscription in their tenant.
     */
    #[Label('List Push Subscriptions')]
    #[Description('Read the list of push device subscriptions for the current tenant. Regular users see their own devices; admins see all.')]
    case SubscriptionsViewAny = 'notifications.subscriptions.viewAny';

    /**
     * Read a single push subscription. Owner or tenant admin.
     */
    #[Label('View Push Subscription')]
    #[Description('Read a single push device subscription. The subscription owner or a tenant admin.')]
    case SubscriptionsView = 'notifications.subscriptions.view';

    /**
     * Register a new push device token for the authenticated user.
     */
    #[Label('Register Push Device')]
    #[Description('Register a new push device token. The device is bound to the authenticated user.')]
    case SubscriptionsCreate = 'notifications.subscriptions.create';

    /**
     * Revoke a push subscription. Owners can revoke their own; tenant admins
     * can revoke any subscription in their tenant.
     */
    #[Label('Revoke Push Subscription')]
    #[Description('Revoke a push subscription. Users can revoke their own devices; tenant admins can revoke any.')]
    case SubscriptionsDelete = 'notifications.subscriptions.delete';

    /**
     * Cross-tenant read for platform support. `device_token` remains hidden
     * regardless of the caller's guard.
     */
    #[Label('View Push Subscriptions (platform)')]
    #[Description('Cross-tenant read access to push subscriptions for platform support triage. Device tokens are still hidden.')]
    case PlatformSubscriptionsViewAny = 'platform.notifications-push.subscriptions.viewAny';

    /**
     * Which Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::SubscriptionsViewAny,
            self::SubscriptionsView,
            self::SubscriptionsCreate,
            self::SubscriptionsDelete           => Guard::Sanctum,
            self::PlatformSubscriptionsViewAny  => Guard::PlatformAdmin,
        };
    }
}
