<?php

declare(strict_types=1);

namespace Academorix\Integrations\Jobs;

use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Academorix\Integrations\Contracts\Services\IntegrationRegistryInterface;
use Academorix\Integrations\Enums\IntegrationSyncStatus;
use Academorix\Integrations\Events\IntegrationSyncCompleted;
use Academorix\Integrations\Events\IntegrationSyncFailed;
use Academorix\Integrations\Events\IntegrationSyncStarted;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sync one Tenant integration against its third-party API.
 *
 * Delegates to the bound {@see IntegrationRegistryInterface}. The
 * default `NullIntegrationRegistry` is a no-op — real deployments
 * bind a driver-catalogue registry.
 *
 * Updates `last_sync_at` / `last_sync_status` / `last_sync_error` /
 * `next_sync_at` and dispatches the started / completed / failed
 * lifecycle events accordingly.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Queue('integrations')]
#[Timeout(300)]
#[Tries(4)]
#[Backoff(300, 1800, 3600, 10800)]
final class SyncIntegrationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $integrationId)
    {
    }

    public function handle(
        TenantIntegrationRepositoryInterface $integrations,
        IntegrationRegistryInterface $registry,
    ): void {
        /** @var TenantIntegration|null $integration */
        $integration = $integrations->find($this->integrationId);
        if ($integration === null) {
            return;
        }

        if ((bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE} !== true) {
            return;
        }

        IntegrationSyncStarted::dispatch($integration);

        try {
            $registry->sync($integration);

            $this->markSuccess($integration);

            IntegrationSyncCompleted::dispatch(
                $integration,
                IntegrationSyncStatus::Success->value,
            );
        } catch (\Throwable $e) {
            $this->markFailed($integration, $e->getMessage());

            IntegrationSyncFailed::dispatch($integration, $e->getMessage());

            throw $e;
        }
    }

    /**
     * `failed()` is invoked by the queue worker after every retry has
     * been exhausted. We flip the row to `failed` one last time so the
     * admin UI reflects the terminal state.
     */
    public function failed(\Throwable $e): void
    {
        // Nothing else — the row was already marked failed inside the
        // catch above on the raising attempt.
    }

    /**
     * Update the row after a clean sync pass. Rolls the
     * `next_sync_at` forward by the configured interval.
     */
    private function markSuccess(TenantIntegration $integration): void
    {
        $minutes = (int) \config('integrations.sync.default_sync_interval_minutes', 60);

        $integration->update([
            TenantIntegrationInterface::ATTR_LAST_SYNC_AT     => \now(),
            TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => IntegrationSyncStatus::Success->value,
            TenantIntegrationInterface::ATTR_LAST_SYNC_ERROR  => null,
            TenantIntegrationInterface::ATTR_NEXT_SYNC_AT     => \now()->addMinutes($minutes),
        ]);
    }

    /**
     * Update the row after a failed sync pass. Keeps `next_sync_at`
     * un-advanced so the worker's backoff schedule is the sole retry
     * driver.
     */
    private function markFailed(TenantIntegration $integration, string $error): void
    {
        $integration->update([
            TenantIntegrationInterface::ATTR_LAST_SYNC_AT     => \now(),
            TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => IntegrationSyncStatus::Failed->value,
            TenantIntegrationInterface::ATTR_LAST_SYNC_ERROR  => \mb_substr($error, 0, 1000),
        ]);
    }
}
