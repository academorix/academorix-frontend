<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * Provider webhook confirmed endpoint delivery.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushDelivered implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
    ) {
    }
}
