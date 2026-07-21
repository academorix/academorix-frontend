<?php

declare(strict_types=1);

namespace Stackra\Subscription\Jobs;

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
use Psr\Log\LoggerInterface;

/**
 * Translate one Cashier webhook payload into our own state.
 *
 * The concrete Cashier binding decides how to interpret the raw
 * event; this job is the queue-safe container for that work.
 * `ShouldBeUnique` + `provider_event_id` gives idempotency across
 * webhook retries.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Queue('notifications-critical')]
#[Tries(5)]
#[Backoff(30, 300, 1800, 3600, 21600)]
final class SyncFromCashierWebhookJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string                  $providerEventId  Provider event id — idempotency key.
     * @param  string                  $provider         `stripe` / `paddle`.
     * @param  array<string, mixed>    $payload          Raw event payload.
     */
    public function __construct(
        public readonly string $providerEventId,
        public readonly string $provider,
        public readonly array $payload,
    ) {
    }

    /**
     * Idempotency key — provider event ids never collide.
     */
    #[UniqueFor(300)]
    public function uniqueId(): string
    {
        return $this->providerEventId;
    }

    /**
     * Handle the sync. The default implementation logs the event and
     * bails — production apps override the binding OR compose a
     * cashier consumer service that reads this job's payload.
     */
    public function handle(LoggerInterface $log): void
    {
        // Delegate the heavy translation to a domain listener. The
        // default binding logs the event so tests can assert dispatch
        // without wiring the full Cashier consumer.
        $log->info('subscription webhook sync received', [
            'provider'          => $this->provider,
            'provider_event_id' => $this->providerEventId,
        ]);
    }

    /**
     * Never propagate a webhook processing failure past retries — a
     * dead-letter row on the queue dashboard is enough of a signal.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
