<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Jobs;

use Academorix\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Enums\SmsOptOutReason;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Persist a new opt-out row.
 *
 * Called by `IngestSmsProviderWebhookJob` when a STOP-keyword arrives via
 * the webhook module. Idempotent — a duplicate (tenant, phone) reads the
 * existing row + returns without a rewrite.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
final class RecordSmsOptOutJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly ?string $tenantId,
        public readonly string $phone,
        public readonly SmsOptOutReason $reason,
        public readonly string $provider,
        public readonly ?string $sourceDeliveryId = null,
        public readonly ?string $inboundMessageBody = null,
    ) {
    }

    #[UniqueFor(60)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%s', $this->tenantId ?? 'global', $this->phone);
    }

    public function handle(SmsOptOutRepositoryInterface $optOuts): void
    {
        $existing = $optOuts->findActiveForPhone($this->phone, $this->tenantId);
        if ($existing !== null) {
            return;
        }

        $optOuts->create([
            SmsOptOutInterface::ATTR_TENANT_ID            => $this->tenantId,
            SmsOptOutInterface::ATTR_PHONE                => $this->phone,
            SmsOptOutInterface::ATTR_REASON               => $this->reason->value,
            SmsOptOutInterface::ATTR_PROVIDER             => $this->provider,
            SmsOptOutInterface::ATTR_SOURCE_DELIVERY_ID   => $this->sourceDeliveryId,
            SmsOptOutInterface::ATTR_INBOUND_MESSAGE_BODY => $this->inboundMessageBody,
            SmsOptOutInterface::ATTR_OPTED_OUT_AT         => now(),
        ]);
    }
}
