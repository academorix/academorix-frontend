<?php

declare(strict_types=1);

namespace Academorix\Notifications\Policies;

use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\Notification;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Notification}.
 *
 * Tenant users access their own inbox rows (`addressee_id` match);
 * platform admins have cross-tenant read + retry authority.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationPolicy
{
    /**
     * `viewAny` — list the inbox.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::ViewAny->value)
            || $user->can(NotificationsPermission::PlatformViewAny->value);
    }

    /**
     * `view` — read one notification.
     */
    public function view(Authenticatable $user, Notification $notification): bool
    {
        if ($user->can(NotificationsPermission::PlatformView->value)) {
            return true;
        }

        if (! $user->can(NotificationsPermission::View->value)) {
            return false;
        }

        return $this->isOwnAddressee($user, $notification);
    }

    /**
     * `markSeen` — mark as seen.
     */
    public function markSeen(Authenticatable $user, Notification $notification): bool
    {
        return $user->can(NotificationsPermission::MarkSeen->value)
            && $this->isOwnAddressee($user, $notification);
    }

    /**
     * `archive` — archive from inbox.
     */
    public function archive(Authenticatable $user, Notification $notification): bool
    {
        return $user->can(NotificationsPermission::Archive->value)
            && $this->isOwnAddressee($user, $notification);
    }

    /**
     * `delete` — hard delete (support tooling only).
     */
    public function delete(Authenticatable $user, Notification $notification): bool
    {
        return $user->can(NotificationsPermission::Delete->value);
    }

    /**
     * `retry` — platform admins only.
     */
    public function retry(Authenticatable $user, Notification $notification): bool
    {
        return $user->can(NotificationsPermission::PlatformRetry->value);
    }

    /**
     * Match the caller's id against the notification's addressee.
     */
    private function isOwnAddressee(Authenticatable $user, Notification $notification): bool
    {
        $addresseeId = $notification->{NotificationInterface::ATTR_ADDRESSEE_ID} ?? null;

        if ($addresseeId === null) {
            return false;
        }

        return (string) $addresseeId === (string) $user->getAuthIdentifier();
    }
}
