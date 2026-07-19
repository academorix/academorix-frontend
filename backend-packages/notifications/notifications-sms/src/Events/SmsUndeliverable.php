<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

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
