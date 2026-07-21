<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Jobs;

use Stackra\Entitlements\Contracts\Services\PlanEntitlementSyncerInterface;
use Stackra\Entitlements\Events\EntitlementSyncCompleted;
use Stackra\Entitlements\Events\EntitlementSyncStarted;
use Stackra\Entitlements\Exceptions\EntitlementSyncFailedException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sync a tenant's entitlements against a subscription plan.
 *
 * Delegates to the bound {@see PlanEntitlementSyncerInterface} — the
 * default `NullPlanEntitlementSyncer` no-ops. The subscription module
 * binds a real implementation. Fires start + completed events regardless.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Queue('entitlements')]
#[Timeout(120)]
#[Tries(3)]
final class SyncEntitlementsFromPlanJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $planId,
        public readonly ?string $fromPlanId = null,
    ) {
    }

    /**
     * Handle the sync.
     */
    public function handle(PlanEntitlementSyncerInterface $syncer): void
    {
        EntitlementSyncStarted::dispatch($this->tenantId, $this->planId, $this->fromPlanId);

        try {
            $updated = $syncer->syncFromPlan($this->tenantId, $this->planId);
        } catch (\Throwable $e) {
            throw EntitlementSyncFailedException::forPlan(
                $this->tenantId,
                $this->planId,
                $e->getMessage(),
            );
        }

        EntitlementSyncCompleted::dispatch($this->tenantId, $this->planId, $updated);
    }

    /**
     * `failed()` — invoked when every retry is exhausted.
     */
    public function failed(\Throwable $e): void
    {
    }
}
