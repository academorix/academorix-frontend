<?php

declare(strict_types=1);

namespace Stackra\Subscription\Services;

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Services\GracePeriodResolverInterface;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Models\Subscription;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Container\Attributes\Scoped;

/**
 * Compute `grace_ends_at` from `subscription.dunning.stages`.
 *
 * The resolver walks the configured stage array and returns the
 * datetime at which the subscription should transition off its
 * current stage. `null` means "no grace window" (trialing / active /
 * terminal states).
 *
 * `#[Scoped]` because the resolver reads config that may change at
 * deploy time; a per-request scope keeps stale reads out of Octane
 * workers.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultGracePeriodResolver implements GracePeriodResolverInterface
{
    /**
     * {@inheritDoc}
     */
    public function resolve(Subscription $subscription): ?DateTimeInterface
    {
        $state = $subscription->{SubscriptionInterface::ATTR_STATE};
        $stateValue = $state instanceof SubscriptionState ? $state->value : (string) $state;

        // These states have no grace window — grace only applies
        // during dunning.
        if (\in_array(
            $stateValue,
            [
                SubscriptionState::Trialing->value,
                SubscriptionState::Active->value,
                SubscriptionState::Cancelled->value,
                SubscriptionState::Expired->value,
            ],
            strict: true,
        )) {
            return null;
        }

        $stages = $this->stagesConfig();
        $stage = null;

        foreach ($stages as $candidate) {
            if (($candidate['stage'] ?? null) === $stateValue) {
                $stage = $candidate;
                break;
            }
        }

        // No matching stage means the caller passed a state the
        // config doesn't know about — return null instead of
        // guessing.
        if ($stage === null) {
            return null;
        }

        $duration = $stage['duration_days'] ?? null;
        if ($duration === null) {
            return null;
        }

        // Prefer the persisted last-payment-failed anchor when
        // present; fall back to now() otherwise.
        $lastFailed = $subscription->{SubscriptionInterface::ATTR_LAST_PAYMENT_FAILED_AT};
        $anchor = $lastFailed instanceof DateTimeInterface
            ? CarbonImmutable::instance($lastFailed)
            : CarbonImmutable::now();

        return $anchor->addDays((int) $duration);
    }

    /**
     * Read the dunning stages array from config. Returns an empty
     * list when unset so the calling code fails-soft rather than
     * throwing.
     *
     * @return list<array<string, mixed>>
     */
    private function stagesConfig(): array
    {
        $raw = \config('subscription.dunning.stages', []);
        if (! \is_array($raw)) {
            return [];
        }

        /** @var list<array<string, mixed>> $stages */
        $stages = \array_values(\array_filter($raw, static fn ($v): bool => \is_array($v)));

        return $stages;
    }
}
