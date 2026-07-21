<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Listeners;

use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Stackra\Notifications\Sms\Events\SmsUndeliverable;
use Stackra\Notifications\Sms\Jobs\RecordSmsOptOutJob;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Automatically opt-out numbers reported permanently undeliverable.
 *
 * The invalid_number reason carries a 30d recheck expiry so the number can
 * be tried again after the carrier's routing may have recovered.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class AddOptOutListener implements ShouldQueue
{
    public string $queue = 'notifications';

    public function handle(SmsUndeliverable $event): void
    {
        RecordSmsOptOutJob::dispatch(
            tenantId: null,
            phone: $event->phone,
            reason: SmsOptOutReason::InvalidNumber,
            provider: $event->provider,
            sourceDeliveryId: $event->deliveryId,
        );
    }
}
