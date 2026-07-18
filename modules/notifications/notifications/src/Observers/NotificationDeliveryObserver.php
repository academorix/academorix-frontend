<?php

declare(strict_types=1);

namespace Academorix\Notifications\Observers;

use Academorix\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Academorix\Notifications\Events\NotificationClicked;
use Academorix\Notifications\Events\NotificationOpened;
use Academorix\Notifications\Events\NotificationQueued;
use Academorix\Notifications\Models\NotificationDelivery;

/**
 * Lifecycle side effects on {@see NotificationDelivery}.
 *
 * Emits `NotificationQueued` on creation for observability;
 * `NotificationOpened` + `NotificationClicked` on the corresponding
 * timestamp transitions.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationDeliveryObserver
{
    /**
     * `created` — observability signal.
     */
    public function created(NotificationDelivery $delivery): void
    {
        NotificationQueued::dispatch($delivery);
    }

    /**
     * `updated` — fire on opened / clicked transitions.
     */
    public function updated(NotificationDelivery $delivery): void
    {
        if ($delivery->wasChanged(NotificationDeliveryInterface::ATTR_OPENED_AT) &&
            $delivery->{NotificationDeliveryInterface::ATTR_OPENED_AT} !== null) {
            NotificationOpened::dispatch($delivery);
        }

        if ($delivery->wasChanged(NotificationDeliveryInterface::ATTR_LAST_CLICK_AT) &&
            $delivery->{NotificationDeliveryInterface::ATTR_LAST_CLICK_AT} !== null) {
            NotificationClicked::dispatch($delivery);
        }
    }
}
