<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

/**
 * Provider accepted the SMS envelope.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final readonly class SmsSent implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $providerMessageId,
        public string $phone,
        public ?int $costMicroUnits,
    ) {
    }
}
