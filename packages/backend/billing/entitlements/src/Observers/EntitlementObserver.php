<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Observers;

use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Services\EntitlementResolverInterface;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Stackra\Entitlements\Events\EntitlementOverridden;
use Stackra\Entitlements\Events\EntitlementResolved;
use Stackra\Entitlements\Models\Entitlement;
use Illuminate\Support\Carbon;

/**
 * Lifecycle side effects on {@see Entitlement}.
 *
 * ## Responsibilities
 *
 *   - `saving`  — recompute period boundaries when kind=pool and the
 *     period column changed (or was just set).
 *   - `updating` — snapshot the pre-update value so `updated` can fire
 *     `EntitlementOverridden` with an accurate `old → new` payload.
 *   - `created` — emit {@see EntitlementResolved}.
 *   - `updated` — emit {@see EntitlementOverridden} when value changed.
 *   - `saved` / `deleted` — flush the resolver cache for the tenant.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
final class EntitlementObserver
{
    /**
     * Per-instance memo of the pre-update value. Populated in
     * `updating`, consumed in `updated`.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $priorValue = [];

    /**
     * `saving` — populate the period columns for pool-kind rows.
     */
    public function saving(Entitlement $entitlement): void
    {
        $kind = $entitlement->{EntitlementInterface::ATTR_KIND};
        if (! ($kind === EntitlementKind::Pool || $kind === EntitlementKind::Pool->value)) {
            return;
        }

        // Only fill when the period column is present + boundaries missing.
        $period = $entitlement->{EntitlementInterface::ATTR_PERIOD};
        if ($period === null) {
            return;
        }

        if ($entitlement->{EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT} === null) {
            $entitlement->{EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT} = \now();
        }

        if ($entitlement->{EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT} === null) {
            $entitlement->{EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT} = $this->computePeriodEnd($period);
        }
    }

    /**
     * `updating` — snapshot the pre-update value.
     */
    public function updating(Entitlement $entitlement): void
    {
        /** @var array<string, mixed> $original */
        $original = $entitlement->getOriginal(EntitlementInterface::ATTR_VALUE) ?? [];
        if (\is_string($original)) {
            $decoded  = \json_decode($original, associative: true);
            $original = \is_array($decoded) ? $decoded : [];
        }

        $this->priorValue[(string) $entitlement->getKey()] = $original;
    }

    /**
     * `created` — fire `EntitlementResolved`.
     */
    public function created(Entitlement $entitlement): void
    {
        EntitlementResolved::dispatch($entitlement);
    }

    /**
     * `updated` — fire `EntitlementOverridden` when the value column
     * changed (skipping `used` counter increments — those fire
     * `EntitlementConsumed` from the usage observer instead).
     */
    public function updated(Entitlement $entitlement): void
    {
        $key   = (string) $entitlement->getKey();
        if (! isset($this->priorValue[$key])) {
            return;
        }

        /** @var array<string, mixed> $current */
        $current = $entitlement->{EntitlementInterface::ATTR_VALUE} ?? [];
        $old     = $this->priorValue[$key];
        unset($this->priorValue[$key]);

        // Distinguish "cap changed" from "counter changed". Cap-only
        // changes fire override; counter changes fire from the usage
        // observer.
        $capChanged =
            ($old['limit'] ?? null) !== ($current['limit'] ?? null)
            || ($old['enabled'] ?? null) !== ($current['enabled'] ?? null);

        if (! $capChanged) {
            return;
        }

        EntitlementOverridden::dispatch(
            $entitlement,
            $old,
            $current,
            $entitlement->{EntitlementInterface::ATTR_NOTES},
        );
    }

    /**
     * `saved` — flush the resolver cache for the tenant.
     */
    public function saved(Entitlement $entitlement): void
    {
        /** @var EntitlementResolverInterface $resolver */
        $resolver = \app(EntitlementResolverInterface::class);
        $resolver->flush((string) $entitlement->{EntitlementInterface::ATTR_TENANT_ID});
    }

    /**
     * `deleted` — flush the resolver cache for the tenant.
     */
    public function deleted(Entitlement $entitlement): void
    {
        /** @var EntitlementResolverInterface $resolver */
        $resolver = \app(EntitlementResolverInterface::class);
        $resolver->flush((string) $entitlement->{EntitlementInterface::ATTR_TENANT_ID});
    }

    /**
     * Compute the period-end datetime for a given period enum.
     */
    private function computePeriodEnd(mixed $period): Carbon
    {
        $now  = \now();
        $enum = $period instanceof EntitlementPeriod
            ? $period
            : (EntitlementPeriod::tryFrom((string) $period) ?? EntitlementPeriod::Monthly);

        return match ($enum) {
            EntitlementPeriod::Monthly     => $now->copy()->addMonth()->startOfMonth(),
            EntitlementPeriod::Anniversary => $now->copy()->addYear(),
            EntitlementPeriod::Lifetime    => $now->copy()->addYears(100),
        };
    }
}
