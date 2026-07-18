<?php

declare(strict_types=1);

namespace Academorix\Subscription\Observers;

use Academorix\Subscription\Contracts\Data\PlanInterface;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Events\PlanArchived;
use Academorix\Subscription\Events\PlanCreated;
use Academorix\Subscription\Events\PlanUpdated;
use Academorix\Subscription\Exceptions\PlanInUseException;
use Academorix\Subscription\Models\Plan;

/**
 * Lifecycle side effects on {@see Plan}.
 *
 * ## Responsibilities
 *
 *   - `created`  — emit {@see PlanCreated}.
 *   - `updated`  — emit {@see PlanUpdated} with the changed column
 *     list so downstream listeners (e.g.
 *     `entitlements::InvalidatePlanCache`) can decide whether to
 *     react.
 *   - `deleting` — refuse the soft-delete when active subscriptions
 *     reference the plan; the caller must archive first.
 *   - `deleted`  — emit {@see PlanArchived}.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanObserver
{
    public function __construct(
        private readonly PlanRepositoryInterface $plans,
    ) {
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(Plan $plan): void
    {
        PlanCreated::dispatch($plan);
    }

    /**
     * `updated` — fire the domain event with a list of changed
     * columns so downstream listeners can decide whether to react.
     */
    public function updated(Plan $plan): void
    {
        /** @var list<string> $changed */
        $changed = \array_values(\array_keys($plan->getChanges()));

        PlanUpdated::dispatch($plan, $changed);
    }

    /**
     * `deleting` — refuse when active subscriptions reference the
     * plan. Throws to abort the delete transaction.
     */
    public function deleting(Plan $plan): void
    {
        $active = $this->plans->countActiveSubscriptions((string) $plan->getKey());
        if ($active > 0) {
            throw PlanInUseException::forPlan((string) $plan->getKey(), $active);
        }
    }

    /**
     * `deleted` — fire the archive event.
     */
    public function deleted(Plan $plan): void
    {
        // Only fire once the archived_at column is populated OR the
        // model was soft-deleted. Hard-deletes still fire the event —
        // downstream listeners key off the plan id, not the
        // archived_at value.
        if ($plan->{PlanInterface::ATTR_ARCHIVED_AT} === null) {
            $plan->{PlanInterface::ATTR_ARCHIVED_AT} = \now();
        }

        PlanArchived::dispatch($plan);
    }
}
