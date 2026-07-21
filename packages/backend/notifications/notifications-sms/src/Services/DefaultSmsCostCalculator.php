<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Services;

use Stackra\Notifications\Sms\Contracts\Services\SmsCostCalculatorInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default (fail-open) {@see SmsCostCalculatorInterface}.
 *
 * Returns `null` cost estimates + `false` cap breach — the module boots
 * without a real cost feed. Consumer apps swap in a provider-backed calculator
 * (Twilio Programmable Voice pricing feed, MessageBird pricing API) by
 * binding their own concrete through this interface's `#[Bind]` attribute.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultSmsCostCalculator implements SmsCostCalculatorInterface
{
    /**
     * {@inheritDoc}
     */
    public function estimateCostMicroUnits(string $provider, string $phoneCountryCode): ?int
    {
        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function wouldExceedCap(string $tenantId, string $provider, string $phoneCountryCode): bool
    {
        return false;
    }
}
