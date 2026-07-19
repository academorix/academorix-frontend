<?php

declare(strict_types=1);

namespace Academorix\Notifications\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Notifications\Models\NotificationPreference;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a preference row is created, updated, or deleted.
 *
 * Consumers include mail suppression list writers, in-app inbox
 * cache invalidators, and compliance audit sinks (Art. 7 consent
 * trail).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.preference.updated')]
final readonly class PreferenceUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationPreference  $preference  The preference row after mutation.
     */
    public function __construct(public NotificationPreference $preference)
    {
    }
}
