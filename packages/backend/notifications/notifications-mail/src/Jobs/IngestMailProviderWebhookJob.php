<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Jobs;

use Stackra\Notifications\Mail\Contracts\Services\MailProviderWebhookIngestorInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Normalise a provider-specific webhook payload into the module's
 * canonical event stream (`MailDelivered` / `MailOpened` /
 * `MailClicked` / `MailBounced` / `MailComplaint`).
 *
 * Dispatched by
 * {@see \Stackra\Notifications\Mail\Listeners\IngestMailProviderWebhookListener}
 * when `webhook::InboundWebhookReceived` fires with
 * `namespace=notifications-mail`, OR by
 * {@see \Stackra\Notifications\Mail\Actions\Central\ReceiveMailWebhook}
 * when a provider posts directly to this module's central receiver.
 *
 * Blueprint parameters:
 *
 *   - `#[Queue('notifications-webhooks')]` — a dedicated queue so
 *     webhook fan-out never blocks user-facing send throughput.
 *   - `#[Tries(3)]` + `#[Backoff(10, 60, 300)]` — retry a transient
 *     DB error; drop after three attempts.
 *
 * Idempotency lives in the ingestor: a payload without a
 * correlation id (`X-Stackra-Notification-Id`) is logged +
 * acknowledged as a no-op, so re-delivery is safe.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/jobs.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Queue('notifications-webhooks')]
#[Timeout(30)]
#[Tries(3)]
#[Backoff(10, 60, 300)]
final class IngestMailProviderWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string                $provider  Provider slug.
     * @param  array<string, mixed>  $payload   Decoded JSON body.
     * @param  array<string, mixed>  $headers   Sanitised request headers.
     */
    public function __construct(
        public readonly string $provider,
        public readonly array $payload,
        public readonly array $headers,
    ) {
    }

    /**
     * Handle the job.
     */
    public function handle(
        MailProviderWebhookIngestorInterface $ingestor,
        LoggerInterface $log,
    ): void {
        if (! (bool) \config('notifications-mail.enabled', true)) {
            return;
        }

        try {
            $ingestor->ingest($this->provider, $this->payload, $this->headers);
        } catch (\Throwable $e) {
            $log->error('notifications-mail: webhook ingest failed', [
                'provider'        => $this->provider,
                'error'           => $e->getMessage(),
                'exception_class' => \get_class($e),
            ]);

            throw $e;
        }
    }

    /**
     * `failed()` — final failure hook. Never propagates.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework records the failure. Ops has
        // the queue failures dashboard to reason about missed
        // webhook events.
    }
}
