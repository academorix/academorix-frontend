<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Jobs;

use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Events\TenantErased;
use Stackra\Tenancy\Models\Tenant;
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
 * Hard-delete an archived Tenant AFTER the 30-day retention window.
 *
 * Cascade signal — fires {@see TenantErased} BEFORE the actual
 * DELETE runs so downstream listeners (activity, audit, settings,
 * webhook) can anonymise their tenant-scoped rows first.
 *
 * Refuses `is_system = true` rows.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(600)]
#[Tries(3)]
#[Backoff(3600, 7200, 21600)]
final class HardDeleteArchivedTenantJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $tenantId)
    {
    }

    /**
     * Execute the job. Fires `TenantErased` before the DELETE so
     * downstream listeners can anonymise their tenant-scoped rows.
     */
    public function handle(TenantRepositoryInterface $tenants): void
    {
        /** @var Tenant|null $tenant */
        $tenant = $tenants->query()->withTrashed()->find($this->tenantId);

        if ($tenant === null) {
            return;
        }

        if ($tenant->{TenantInterface::ATTR_IS_SYSTEM} === true) {
            // Refuse — system tenants are never hard-deleted.
            return;
        }

        $applicationId = (string) $tenant->{TenantInterface::ATTR_APPLICATION_ID};

        // Fire the compliance-cascade signal FIRST — downstream
        // listeners anonymise their rows before the FK cascade runs.
        TenantErased::dispatch($this->tenantId, $applicationId);

        // Force-delete cascades through every tenant_id FK
        // (BelongsToTenant + `restrictOnDelete` semantics — every
        // FK either cascades or is manually cleaned before we reach
        // this point).
        $tenant->forceDelete();
    }

    /**
     * Failure handler — log intent so ops can reason later.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — dispatchable jobs auto-log on failure. This method
        // exists so future observability wiring (Sentry breadcrumbs,
        // custom fail counters) has a place to land.
    }
}
