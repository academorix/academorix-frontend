<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * Provider accepted the SMS envelope.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsEvent]
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
