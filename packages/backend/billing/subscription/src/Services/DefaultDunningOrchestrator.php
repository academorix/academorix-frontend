<?php

declare(strict_types=1);

namespace Academorix\Subscription\Services;

use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Contracts\Services\DunningOrchestratorInterface;
use Academorix\Subscription\Contracts\Services\GracePeriodResolverInterface;
use Academorix\Subscription\Enums\SubscriptionState;
use Academorix\Subscription\Models\Subscription;
use Illuminate\Container\Attributes\Scoped;

/**
 * Grace-period progression orchestrator.
 *
 * Walks the configured stage list and advances a subscription to
 * the next stage when its `grace_ends_at` has passed. Idempotent —
 * a subscription already in a terminal state is a no-op.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultDunningOrchestrator implements DunningOrchestratorInterface
{
    public function __construct(
        private readonly GracePeriodResolverInterface $gracePeriod,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function advance(Subscription $subscription): Subscription
    {
        $next = $this->nextStage($subscription);
        if ($next === null) {
            return $subscription;
        }

        // Only progress when the persisted grace boundary has passed.
        $graceEnds = $subscription->{SubscriptionInterface::ATTR_GRACE_ENDS_AT};
        if ($graceEnds !== null && $graceEnds->isFuture()) {
            return $subscription;
        }

        $subscription->{SubscriptionInterface::ATTR_STATE} = $next;

        // Refresh the grace boundary via the resolver. The refresh
        // reads the newly-set state so the boundary lands on the
        // NEXT stage, not the one we just left.
        $newGrace = $this->gracePeriod->resolve($subscription);
        $subscription->{SubscriptionInterface::ATTR_GRACE_ENDS_AT} = $newGrace;

        if ($next === SubscriptionState::Suspended->value) {
            $subscription->{SubscriptionInterface::ATTR_SUSPENDED_AT} = \now();
        }

        if ($next === SubscriptionState::Cancelled->value) {
            $subscription->{SubscriptionInterface::ATTR_CANCELLED_AT} = \now();
        }

        $subscription->save();

        return $subscription;
    }

    /**
     * {@inheritDoc}
     */
    public function nextStage(Subscription $subscription): ?string
    {
        $currentState = $subscription->{SubscriptionInterface::ATTR_STATE};
        $currentValue = $currentState instanceof SubscriptionState
            ? $currentState->value
            : (string) $currentState;

        return match ($currentValue) {
            SubscriptionState::AtRisk->value  => SubscriptionState::Grace->value,
            SubscriptionState::Grace->value,
            SubscriptionState::PastDue->value => SubscriptionState::Suspended->value,
            SubscriptionState::Unpaid->value,
            SubscriptionState::Suspended->value => SubscriptionState::Cancelled->value,
            default                             => null,
        };
    }
}
