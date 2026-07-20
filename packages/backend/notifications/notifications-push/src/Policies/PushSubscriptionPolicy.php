<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Policies;

use Academorix\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Academorix\Notifications\Push\Enums\NotificationsPushPermission;
use Academorix\Notifications\Push\Models\PushSubscription;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see PushSubscription}.
 *
 * Users can read + revoke their own subscriptions; tenant admins can act on
 * any subscription in their tenant; platform staff have cross-tenant read
 * via the `platform.notifications-push.subscriptions.viewAny` permission.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PushSubscriptionPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsPushPermission::SubscriptionsViewAny->value)
            || $user->can(NotificationsPushPermission::PlatformSubscriptionsViewAny->value);
    }

    public function view(Authenticatable $user, PushSubscription $subscription): bool
    {
        if ($user->can(NotificationsPushPermission::PlatformSubscriptionsViewAny->value)) {
            return true;
        }

        return $user->can(NotificationsPushPermission::SubscriptionsView->value)
            && $this->belongsToCaller($user, $subscription);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(NotificationsPushPermission::SubscriptionsCreate->value);
    }

    public function delete(Authenticatable $user, PushSubscription $subscription): bool
    {
        return $user->can(NotificationsPushPermission::SubscriptionsDelete->value)
            && $this->belongsToCaller($user, $subscription);
    }

    /**
     * Match the subscription's `user_id` against the caller — regular users
     * can only touch their own. Tenant admins escape this check because they
     * carry a broader permission scope resolved above.
     */
    private function belongsToCaller(Authenticatable $user, PushSubscription $subscription): bool
    {
        $callerId = \method_exists($user, 'getKey') ? (string) $user->getKey() : null;
        if ($callerId === null) {
            return false;
        }

        return $callerId === (string) $subscription->{PushSubscriptionInterface::ATTR_USER_ID};
    }
}
