<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * Provider webhook returned final cost data for a delivered SMS.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class SmsCostRecorded implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $deliveryId,
        public string $tenantId,
        public string $provider,
        public string $phoneCountryCode,
        public int $costMicroUnits,
        public string $currency,
    ) {
    }
}
