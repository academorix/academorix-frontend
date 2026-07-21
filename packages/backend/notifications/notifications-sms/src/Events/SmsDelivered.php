<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * Provider webhook confirmed carrier delivery.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class SmsDelivered implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
    ) {
    }
}
