<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Jobs;

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Stackra\Entitlements\Events\EntitlementReset;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Reset pool-kind entitlement counters at period boundaries.
 *
 * Iterates every pool-kind entitlement whose `current_period_ends_at`
 * has passed, sets `value.used = 0`, recomputes `current_period_*`
 * bounds, and fires {@see EntitlementReset} with the previous `used`
 * value.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Queue('entitlements')]
#[Timeout(300)]
#[Tries(3)]
final class ResetPeriodicUsageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string|null  $entitlementId  Reset only this row (targeted).
     *                                      When null, scan every expiring row.
     */
    public function __construct(public readonly ?string $entitlementId = null)
    {
    }

    /**
     * Handle the reset.
     */
    public function handle(EntitlementRepositoryInterface $entitlements): void
    {
        $rows = $this->entitlementId !== null
            ? \collect(\array_filter([$entitlements->find($this->entitlementId)]))
            : $entitlements->findExpiringBefore(\now());

        foreach ($rows as $entitlement) {
            /** @var array<string, mixed> $value */
            $value        = $entitlement->{EntitlementInterface::ATTR_VALUE} ?? [];
            $previousUsed = (int) ($value['used'] ?? 0);

            $value['used'] = 0;

            $period = $entitlement->{EntitlementInterface::ATTR_PERIOD};
            $enum   = $period instanceof EntitlementPeriod
                ? $period
                : (EntitlementPeriod::tryFrom((string) $period) ?? EntitlementPeriod::Monthly);

            $nextEnd = match ($enum) {
                EntitlementPeriod::Monthly     => \now()->addMonth()->startOfMonth(),
                EntitlementPeriod::Anniversary => \now()->addYear(),
                EntitlementPeriod::Lifetime    => \now()->addYears(100),
            };

            $entitlement->update([
                EntitlementInterface::ATTR_VALUE                    => $value,
                EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT => \now(),
                EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT   => $nextEnd,
            ]);

            EntitlementReset::dispatch(
                $entitlement->refresh(),
                $previousUsed,
                $nextEnd,
            );
        }
    }

    /**
     * `failed()` — invoked when every retry is exhausted.
     */
    public function failed(\Throwable $e): void
    {
    }
}
