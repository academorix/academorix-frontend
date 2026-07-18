<?php

declare(strict_types=1);

namespace Academorix\Webhook\Jobs;

use Academorix\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Prune `webhook_deliveries` rows older than `$daysToRetain`.
 *
 * Called by the scheduled `webhook:prune` command (typically once a
 * day). Uses a BRIN-friendly range delete via the repository.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(1800)]
#[Tries(1)]
final class PruneWebhookDeliveriesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly int $daysToRetain = 90)
    {
    }

    public function handle(WebhookDeliveryRepositoryInterface $deliveries): int
    {
        $cutoff = \now()->subDays(\max(1, $this->daysToRetain));

        return $deliveries->pruneOlderThan($cutoff);
    }

    public function failed(\Throwable $e): void
    {
    }
}
