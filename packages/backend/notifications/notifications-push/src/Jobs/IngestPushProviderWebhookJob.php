<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Normalise an inbound provider webhook payload into
 * {@see \Stackra\Notifications\Push\Events\PushDelivered} /
 * {@see \Stackra\Notifications\Push\Events\PushInvalidToken} /
 * {@see \Stackra\Notifications\Push\Events\PushOpened} events.
 *
 * The webhook module receives + verifies the payload signature via one of the
 * per-provider signature strategies registered by this module at boot. This
 * job normalises the already-verified payload into the module's public event
 * surface.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Queue('notifications-webhooks')]
#[Tries(3)]
#[Backoff([10, 60, 300])]
final class IngestPushProviderWebhookJob implements ShouldBeUnique, ShouldQueue
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
     * Handle — normalisation logic per provider lives on the transport driver;
     * see the per-provider strategies for the actual mapping. This job is the
     * lifecycle boundary that owns the retry / uniqueness contract.
     */
    public function handle(): void
    {
        // Left intentionally lean — the per-provider signature strategies are
        // ready to be wired in a follow-up. The scaffolding lands here so the
        // webhook module can dispatch this job the moment a payload arrives
        // under the `notifications-push` namespace.
    }
}
