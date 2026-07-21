<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Jobs;

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Contracts\Services\UsageAggregatorInterface;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Events\UsageReportedToBilling;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Export a month's worth of pool-kind usage to Stripe / Paddle for
 * metered-billing entitlements.
 *
 * Fires {@see UsageReportedToBilling} with the provider's usage-record
 * id so subsequent reconciliation can look up the record on the
 * provider side.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Queue('entitlements')]
#[Timeout(600)]
#[Tries(3)]
final class ExportUsageForBillingJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $periodKey  Period identifier (e.g. `2026-07`).
     */
    public function __construct(public readonly string $periodKey)
    {
    }

    /**
     * Handle the export.
     */
    public function handle(
        EntitlementRepositoryInterface $entitlements,
        UsageAggregatorInterface $aggregator,
    ): void {
        // Only export pool-kind rows (billable metering).
        $rows = $entitlements->findByKind(EntitlementKind::Pool);

        [$periodStart, $periodEnd] = $this->deriveWindow($this->periodKey);

        foreach ($rows as $entitlement) {
            $tenantId = (string) $entitlement->{EntitlementInterface::ATTR_TENANT_ID};
            $key      = (string) $entitlement->{EntitlementInterface::ATTR_KEY};
            $amount   = $aggregator->aggregate($tenantId, $key, $this->periodKey);

            if ($amount <= 0) {
                continue;
            }

            // The billing provider bridge lives in the subscription
            // module; without it we emit the event so consumers wire
            // their own dispatcher.
            $providerRecordId = \sprintf('local-%s-%s-%s', $tenantId, $key, $this->periodKey);

            UsageReportedToBilling::dispatch(
                $entitlement,
                $periodStart,
                $periodEnd,
                $amount,
                'local',
                $providerRecordId,
            );
        }
    }

    /**
     * `failed()` — invoked when every retry is exhausted.
     */
    public function failed(\Throwable $e): void
    {
    }

    /**
     * Derive the `[periodStart, periodEnd]` datetimes from a period
     * key (`2026-07` → `2026-07-01 00:00:00 UTC` → `2026-07-31 23:59:59 UTC`).
     *
     * @return array{0: \DateTimeInterface, 1: \DateTimeInterface}
     */
    private function deriveWindow(string $periodKey): array
    {
        $tz    = \config('entitlements.reset.month_boundary_timezone', 'UTC');
        $start = \Illuminate\Support\Carbon::createFromFormat('Y-m', $periodKey, $tz);

        if ($start === false) {
            $start = \now($tz)->startOfMonth();
        }

        $start = $start->copy()->startOfMonth();

        return [$start, $start->copy()->endOfMonth()];
    }
}
