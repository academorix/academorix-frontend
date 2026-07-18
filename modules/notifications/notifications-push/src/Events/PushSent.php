<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

/**
 * SendPushJob completed — provider accepted the payload and returned a
 * message id.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
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
