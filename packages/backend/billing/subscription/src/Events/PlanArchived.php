<?php

declare(strict_types=1);

namespace Stackra\Subscription\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Subscription\Models\Plan;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Plan is soft-deleted / marked archived.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'subscription.plan.archived')]
final readonly class PlanArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Plan $plan)
    {
    }
}
