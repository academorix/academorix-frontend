<?php

declare(strict_types=1);

namespace Stackra\Notifications\Observers;

use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Events\NotificationArchived;
use Stackra\Notifications\Events\NotificationDelivered;
use Stackra\Notifications\Events\NotificationDispatched;
use Stackra\Notifications\Events\NotificationFailed;
use Stackra\Notifications\Events\NotificationSeen;
use Stackra\Notifications\Events\NotificationSent;
use Stackra\Notifications\Models\Notification;

/**
 * Lifecycle side effects on {@see Notification}.
 *
 * Fires the appropriate `NotificationXxx` event on state transitions.
 * Every event carries the full context downstream consumers need —
 * they never look the notification up by id.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationObserver
{
    /**
     * `created` — emit `NotificationDispatched` for channel modules to
     * pick up and translate to their transport.
     */
    public function created(Notification $notification): void
    {
        NotificationDispatched::dispatch($notification);
    }

    /**
     * `updated` — inspect the dirty state to decide which event to fire.
     */
    public function updated(Notification $notification): void
    {
        // Emit state-transition events based on which field just moved.
        if ($notification->wasChanged(NotificationInterface::ATTR_STATE)) {
            $this->fireStateTransition($notification);
        }

        if ($notification->wasChanged(NotificationInterface::ATTR_SEEN_AT) &&
            $notification->{NotificationInterface::ATTR_SEEN_AT} !== null) {
            NotificationSeen::dispatch($notification);
        }

        if ($notification->wasChanged(NotificationInterface::ATTR_ARCHIVED_AT) &&
            $notification->{NotificationInterface::ATTR_ARCHIVED_AT} !== null) {
            NotificationArchived::dispatch($notification);
        }
    }

    /**
     * Fire the correct event for the new state.
     */
    private function fireStateTransition(Notification $notification): void
    {
        $stateValue = $notification->{NotificationInterface::ATTR_STATE};
        $state = $stateValue instanceof NotificationStatus
            ? $stateValue
            : NotificationStatus::tryFrom((string) $stateValue);

        if ($state === null) {
            return;
        }

        match ($state) {
            NotificationStatus::Sent      => NotificationSent::dispatch($notification),
            NotificationStatus::Delivered => NotificationDelivered::dispatch($notification),
            NotificationStatus::Failed    => NotificationFailed::dispatch($notification),
            default => null,
        };
    }
}
