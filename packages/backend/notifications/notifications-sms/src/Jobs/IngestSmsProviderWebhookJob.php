<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Jobs;

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
 * Normalise an inbound provider webhook payload into the module's public
 * event surface.
 *
 * Handles delivery receipts (fire {@see \Stackra\Notifications\Sms\Events\SmsDelivered}
 * / {@see \Stackra\Notifications\Sms\Events\SmsFailed} /
 * {@see \Stackra\Notifications\Sms\Events\SmsUndeliverable}) AND inbound
 * messages (parse STOP / START / HELP keywords).
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Queue('notifications-webhooks')]
#[Tries(3)]
final class IngestSmsProviderWebhookJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $provider,
        public readonly string $providerEventId,
        /** @var array<string, mixed> */
        public readonly array $payload,
    ) {
    }

    #[UniqueFor(60)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%s', $this->provider, $this->providerEventId);
    }

    /**
     * Handle — normalisation logic per provider lives on the transport
     * driver. This job is the lifecycle boundary that owns the retry +
     * uniqueness contract.
     */
    public function handle(): void
    {
        // Left lean by design — the per-provider signature strategies + the
        // inbound parser live outside the job boundary. This scaffolding
        // lands here so the webhook module can dispatch the job the moment a
        // `notifications-sms` payload arrives.
    }
}
