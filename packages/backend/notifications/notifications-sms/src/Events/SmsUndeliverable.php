<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * Permanent carrier failure — invalid number, unreachable carrier.
 *
 * Consumers automatically add the phone to the opt-out list with reason
 * `invalid_number` + 30d recheck expiry.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class SmsUndeliverable implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $phone,
        public string $errorCode,
    ) {
    }
}
