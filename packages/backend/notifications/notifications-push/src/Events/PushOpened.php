<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * The client SDK reported the user tapped the notification.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushOpened implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public ?string $actionId = null,
    ) {
    }
}
