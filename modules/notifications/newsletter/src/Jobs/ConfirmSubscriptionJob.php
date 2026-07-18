<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Jobs;

use Academorix\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Async confirmation processing when the caller hits
 * `GET /newsletters/{newsletter}/confirm/{token}`.
 *
 * Validates the token, flips the subscription to `active`, fires
 * the confirmed event. Dispatched by the public confirm action
 * when the caller wants the confirmation processed off the HTTP
 * hot path (large mailing lists can produce a spike of confirm
 * requests when a broadcast lands).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(30)]
#[Tries(3)]
#[UniqueFor(300)]
final class ConfirmSubscriptionJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $token)
    {
    }

    public function uniqueId(): string
    {
        return 'newsletter:confirm:' . \hash('sha256', $this->token);
    }

    public function handle(
        NewsletterServiceInterface $service,
        LoggerInterface $log,
    ): void {
        try {
            $service->confirmSubscription($this->token);
        } catch (\Throwable $e) {
            $log->info('newsletter: async confirm failed', [
                'error' => $e->getMessage(),
                'class' => \get_class($e),
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
