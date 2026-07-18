<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

/**
 * Provider webhook confirmed carrier delivery.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final readonly class SmsDelivered implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
    ) {
    }
}
