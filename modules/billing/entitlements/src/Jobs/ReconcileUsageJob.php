<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Jobs;

use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Contracts\Services\UsageAggregatorInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sum `EntitlementUsage.delta` rows per period and correct the
 * parent `value.used` counter when Postgres drifted from Redis.
 *
 * The recorder mutates the parent counter on every consumption, but
 * Redis + Postgres can drift when a worker crashes mid-transaction
 * or under heavy load. This job re-derives `used` from the audit
 * trail and writes a correction when drift exceeds the tolerance.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Queue('entitlements')]
#[Timeout(600)]
#[Tries(2)]
final class ReconcileUsageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string|null  $tenantId  Reconcile only this tenant's rows.
     *                                 When null, iterate every row.
     */
    public function __construct(public readonly ?string $tenantId = null)
    {
    }

    /**
     * Handle the reconciliation.
     */
    public function handle(
        EntitlementRepositoryInterface $entitlements,
        UsageAggregatorInterface $aggregator,
    ): void {
        $rows = $this->tenantId !== null
            ? $entitlements->findAllForTenant($this->tenantId)
            : $entitlements->paginate(1000)->getCollection();

        $periodKey = \now()->format('Y-m');

        foreach ($rows as $entitlement) {
            /** @var array<string, mixed> $value */
            $value          = $entitlement->{EntitlementInterface::ATTR_VALUE} ?? [];
            $recordedUsed   = (int) ($value['used'] ?? 0);
            $tenantId       = (string) $entitlement->{EntitlementInterface::ATTR_TENANT_ID};
            $key            = (string) $entitlement->{EntitlementInterface::ATTR_KEY};
            $observedUsed   = $aggregator->aggregate($tenantId, $key, $periodKey);
            $drift          = \abs($recordedUsed - $observedUsed);
            $tolerance      = (int) \config('entitlements.redis.tolerance', 100);

            if ($drift <= $tolerance) {
                continue;
            }

            // Write the correction.
            $value['used'] = $observedUsed;
            $entitlement->update([
                EntitlementInterface::ATTR_VALUE => $value,
            ]);
        }
    }

    /**
     * `failed()` — invoked when every retry is exhausted.
     */
    public function failed(\Throwable $e): void
    {
    }
}
