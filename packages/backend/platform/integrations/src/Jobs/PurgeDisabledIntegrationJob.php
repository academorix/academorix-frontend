<?php

declare(strict_types=1);

namespace Stackra\Integrations\Jobs;

use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Models\TenantIntegration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Hard-delete a soft-deleted integration once it's aged past the
 * configured retention window (`integrations.retention.hard_delete_days`).
 *
 * Called by
 * {@see \Stackra\Integrations\Observers\TenantIntegrationObserver}
 * on the row's `deleted` hook (as the initial delayed trigger) and by
 * {@see \Stackra\Integrations\Console\IntegrationsPurgeDisabledCommand}
 * on the periodic sweep.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(60)]
#[Tries(2)]
final class PurgeDisabledIntegrationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $integrationId)
    {
    }

    public function handle(): void
    {
        /** @var TenantIntegration|null $integration */
        $integration = TenantIntegration::withTrashed()
            ->where(TenantIntegrationInterface::ATTR_ID, $this->integrationId)
            ->first();

        if ($integration === null) {
            return;
        }

        // Only hard-delete rows that are already soft-deleted AND
        // whose `deleted_at` is past the retention window.
        $deletedAt = $integration->{TenantIntegrationInterface::ATTR_DELETED_AT};
        if ($deletedAt === null) {
            return;
        }

        $days   = (int) \config('integrations.retention.hard_delete_days', 30);
        $cutoff = \now()->subDays($days);

        if ($deletedAt->greaterThan($cutoff)) {
            return;
        }

        $integration->forceDelete();
    }

    public function failed(\Throwable $e): void
    {
    }
}
