<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * SendPushJob completed — provider accepted the payload and returned a
 * message id.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushSent implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $subscriptionId,
        public string $provider,
        public string $providerMessageId,
        public string $platform,
    ) {
    }
}
