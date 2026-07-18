<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Jobs;

use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Events\TenantProvisioned;
use Academorix\Tenancy\Models\Tenant;
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
 * Async provisioning tail.
 *
 * The synchronous {@see \Academorix\Tenancy\Actions\Support\ProvisionTenant}
 * orchestrator creates the Tenant + owner + default sub-rows in one
 * transaction. This job handles the outbound side (welcome email,
 * DNS record write for the auto-subdomain, search index warm-up).
 *
 * Re-fires `TenantProvisioned` so tolerant listeners see the event
 * on the queue worker even if the request-time dispatch missed
 * (queue-only listeners in an isolated deployment).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Queue('provisioning')]
#[Timeout(120)]
#[Tries(5)]
#[Backoff(60, 300, 900, 1800, 3600)]
final class ProvisionTenantJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $tenantId)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(TenantRepositoryInterface $tenants): void
    {
        /** @var Tenant|null $tenant */
        $tenant = $tenants->find($this->tenantId);
        if ($tenant === null) {
            return;
        }

        // Re-fire — queue-worker listeners see the event even if the
        // request-time dispatch was skipped by a listener filter.
        TenantProvisioned::dispatch($tenant);
    }

    /**
     * Failure handler.
     */
    public function failed(\Throwable $e): void
    {
        // Placeholder — future observability wiring hangs here.
    }
}
