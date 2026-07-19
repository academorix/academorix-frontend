<?php

declare(strict_types=1);

namespace Academorix\Subscription\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Subscription\Models\Plan;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched after a Plan row is mutated (name / description /
 * price / default_entitlements / metadata).
 *
 * Consumed by `entitlements::InvalidatePlanCache` so the plan-sync
 * pipeline picks up the change.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.plan.updated')]
final readonly class PlanUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Plan          $plan            The mutated plan.
     * @param  list<string>  $changedFields   Column names that changed.
     */
    public function __construct(
        public Plan $plan,
        public array $changedFields = [],
    ) {
    }
}
