<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Academorix\Events\Attributes\AsEvent;
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
