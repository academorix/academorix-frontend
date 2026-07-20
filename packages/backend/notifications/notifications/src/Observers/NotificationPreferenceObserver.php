<?php

declare(strict_types=1);

namespace Academorix\Notifications\Observers;

use Academorix\Notifications\Events\PreferenceUpdated;
use Academorix\Notifications\Models\NotificationPreference;

/**
 * Lifecycle side effects on {@see NotificationPreference}.
 *
 * Fires `PreferenceUpdated` on create + update + delete so consumers
 * (mail suppression list, in-app inbox listener) see every change
 * to the consent trail.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationPreferenceObserver
{
    /**
     * `created` — first-time opt-in row.
     */
    public function created(NotificationPreference $preference): void
    {
        PreferenceUpdated::dispatch($preference);
    }

    /**
     * `updated` — any change to a preference row.
     */
    public function updated(NotificationPreference $preference): void
    {
        PreferenceUpdated::dispatch($preference);
    }

    /**
     * `deleted` — preference removed (usually GDPR erasure).
     */
    public function deleted(NotificationPreference $preference): void
    {
        PreferenceUpdated::dispatch($preference);
    }
}
