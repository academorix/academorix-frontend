<?php

declare(strict_types=1);

namespace Academorix\Notifications\Policies;

use Academorix\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\Models\NotificationPreference;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see NotificationPreference}.
 *
 * Users only see + update their own preferences; tenant admins get
 * cross-user read via a dedicated permission for DPO / support work.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationPreferencePolicy
{
    /**
     * `viewAny` — list preferences.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::PreferencesView->value);
    }

    /**
     * `view` — read a single preference row.
     */
    public function view(Authenticatable $user, NotificationPreference $preference): bool
    {
        if ($user->can(NotificationsPermission::PreferencesAdminView->value)) {
            return true;
        }

        return $user->can(NotificationsPermission::PreferencesView->value)
            && $this->isOwnPreference($user, $preference);
    }

    /**
     * `update` — update own preferences.
     */
    public function update(Authenticatable $user, NotificationPreference $preference): bool
    {
        return $user->can(NotificationsPermission::PreferencesUpdate->value)
            && $this->isOwnPreference($user, $preference);
    }

    /**
     * `delete` — delete own preferences (rare).
     */
    public function delete(Authenticatable $user, NotificationPreference $preference): bool
    {
        return $user->can(NotificationsPermission::PreferencesUpdate->value)
            && $this->isOwnPreference($user, $preference);
    }

    /**
     * `adminView` — tenant admin sees any user's preferences.
     */
    public function adminView(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::PreferencesAdminView->value);
    }

    /**
     * Compare the caller's id against the preference's user id.
     */
    private function isOwnPreference(Authenticatable $user, NotificationPreference $preference): bool
    {
        $userId = $preference->{NotificationPreferenceInterface::ATTR_USER_ID} ?? null;

        if ($userId === null) {
            return false;
        }

        return (string) $userId === (string) $user->getAuthIdentifier();
    }
}
