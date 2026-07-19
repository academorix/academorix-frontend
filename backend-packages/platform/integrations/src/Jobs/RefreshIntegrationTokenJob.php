<?php

declare(strict_types=1);

namespace Academorix\Integrations\Jobs;

use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Academorix\Integrations\Contracts\Services\IntegrationRegistryInterface;
use Academorix\Integrations\Events\IntegrationTokenRefreshed;
use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Refresh the OAuth access token embedded in an integration's `config`.
 *
 * Delegates to the bound {@see IntegrationRegistryInterface}. The
 * default `NullIntegrationRegistry` is a no-op — real deployments
 * bind a driver that knows the provider-specific token endpoint.
 *
 * On success emits {@see IntegrationTokenRefreshed}. On failure the
 * worker's retry policy governs re-attempts.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Queue('integrations')]
#[Timeout(60)]
#[Tries(3)]
final class RefreshIntegrationTokenJob implements ShouldQueue
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

        // The registry knows the provider-specific token-refresh
        // endpoint. Reuses the `sync()` seam — a driver may model
        // token refresh as a first step of its sync loop.
        $registry->sync($integration);

        IntegrationTokenRefreshed::dispatch($integration);
    }

    public function failed(\Throwable $e): void
    {
    }
}
