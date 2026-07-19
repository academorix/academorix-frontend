<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Contracts\Services;

use Academorix\Notifications\Sms\Services\DefaultSmsCostCalculator;
use Illuminate\Container\Attributes\Bind;

/**
 * SMS cost calculator seam.
 *
 * The dispatch job calls {@see wouldExceedCap()} before send to honour the
 * monthly cost cap. Consumer apps override the default by binding their own
 * concrete class through this interface's `#[Bind]` attribute — the default
 * is a zero-cost no-op fallback so the module boots without a real cost data
 * feed.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Bind(DefaultSmsCostCalculator::class)]
interface SmsCostCalculatorInterface
{
    /**
     * Estimate the cost for one message in micro-units of the tenant's
     * billing currency. `null` when the provider hasn't published a rate for
     * the destination.
     */
    public function estimateCostMicroUnits(string $provider, string $phoneCountryCode): ?int;

    /**
     * Whether sending one message would push the tenant over its monthly
     * cost cap. Fail-open by default (no cap enforced when data is missing).
     */
    public function wouldExceedCap(string $tenantId, string $provider, string $phoneCountryCode): bool;
}
