<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Services;

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementUsageRepositoryInterface;
use Stackra\Entitlements\Contracts\Services\UsageRecorderInterface;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Stackra\Entitlements\Models\Entitlement;
use Stackra\Entitlements\Models\EntitlementUsage;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default {@see UsageRecorderInterface}.
 *
 * Writes an append-only `EntitlementUsage` row + increments the
 * parent's `value.used` counter atomically. The row's
 * `current_period_key` is derived from the parent's declared period.
 *
 * `EntitlementConsumed` is fired by the observer on the newly-created
 * row so it lands after the transaction commits.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultUsageRecorder implements UsageRecorderInterface
{
    public function __construct(
        private readonly EntitlementUsageRepositoryInterface $usages,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function record(
        Entitlement $entitlement,
        int $delta,
        string $reason,
        ?string $correlationId = null,
    ): EntitlementUsage {
        $periodKey = $this->periodKeyFor($entitlement);

        /** @var EntitlementUsage $row */
        $row = $this->usages->create([
            EntitlementUsageInterface::ATTR_TENANT_ID          => (string) $entitlement->{EntitlementInterface::ATTR_TENANT_ID},
            EntitlementUsageInterface::ATTR_ENTITLEMENT_ID     => (string) $entitlement->getKey(),
            EntitlementUsageInterface::ATTR_KEY                => (string) $entitlement->{EntitlementInterface::ATTR_KEY},
            EntitlementUsageInterface::ATTR_DELTA              => $delta,
            EntitlementUsageInterface::ATTR_REASON             => $reason,
            EntitlementUsageInterface::ATTR_CORRELATION_ID     => $correlationId,
            EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY => $periodKey,
        ]);

        // Increment the parent's `value.used` counter atomically.
        $this->incrementParentUsage($entitlement, $delta);

        return $row;
    }

    /**
     * Derive the period key for the row. Monthly → `YYYY-MM`,
     * anniversary → `YYYY-MM-DD-anniversary`, lifetime → `lifetime`.
     * Non-pool kinds also get a `YYYY-MM` bucket so historical
     * queries still work.
     */
    private function periodKeyFor(Entitlement $entitlement): string
    {
        $period = $entitlement->{EntitlementInterface::ATTR_PERIOD} ?? null;

        return match (true) {
            $period === EntitlementPeriod::Lifetime, $period === EntitlementPeriod::Lifetime->value    => 'lifetime',
            $period === EntitlementPeriod::Anniversary, $period === EntitlementPeriod::Anniversary->value => \now()->format('Y-m-d') . '-anniversary',
            default => \now()->format('Y-m'),
        };
    }

    /**
     * Mutate `value.used` on the parent row. Skipped for boolean +
     * unlimited kinds (no counter).
     */
    private function incrementParentUsage(Entitlement $entitlement, int $delta): void
    {
        $kind = $entitlement->{EntitlementInterface::ATTR_KIND};
        if (
            $kind === EntitlementKind::Boolean
            || $kind === EntitlementKind::Boolean->value
            || $kind === EntitlementKind::Unlimited
            || $kind === EntitlementKind::Unlimited->value
        ) {
            return;
        }

        /** @var array<string, mixed> $value */
        $value         = $entitlement->{EntitlementInterface::ATTR_VALUE} ?? [];
        $value['used'] = \max(0, (int) ($value['used'] ?? 0) + $delta);

        $entitlement->update([
            EntitlementInterface::ATTR_VALUE => $value,
        ]);
    }
}
