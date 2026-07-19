<?php

declare(strict_types=1);

namespace Academorix\Subscription\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Subscription\Contracts\Data\PlanInterface;
use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Enums\SubscriptionState;
use Academorix\Subscription\Models\Plan;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Eloquent implementation of {@see PlanRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — the catalogue is read
 * heavily on every pricing-page render but changes infrequently.
 * The observer flushes the plan-tag on writes so ops-driven edits
 * propagate immediately.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(PlanInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    PlanInterface::ATTR_APPLICATION_ID => ['$eq', '$in'],
    PlanInterface::ATTR_KEY            => ['$eq'],
    PlanInterface::ATTR_TIER           => ['$eq', '$in'],
    PlanInterface::ATTR_BILLING_CYCLE  => ['$eq', '$in'],
    PlanInterface::ATTR_BILLING_MODE   => ['$eq', '$in'],
    PlanInterface::ATTR_IS_PUBLIC      => ['$eq'],
    PlanInterface::ATTR_IS_DEPRECATED  => ['$eq'],
    PlanInterface::ATTR_IS_SYSTEM      => ['$eq'],
])]
final class EloquentPlanRepository extends Repository implements PlanRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findPublicForApplication(string $applicationId): Collection
    {
        /** @var Collection<int, Plan> $rows */
        $rows = $this->query()
            ->where(PlanInterface::ATTR_APPLICATION_ID, $applicationId)
            ->where(PlanInterface::ATTR_IS_PUBLIC, true)
            ->where(PlanInterface::ATTR_IS_DEPRECATED, false)
            ->whereNull(PlanInterface::ATTR_ARCHIVED_AT)
            ->orderBy(PlanInterface::ATTR_SORT_ORDER)
            ->orderBy(PlanInterface::ATTR_KEY)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByKey(string $applicationId, string $key): ?Plan
    {
        /** @var Plan|null $row */
        $row = $this->query()
            ->where(PlanInterface::ATTR_APPLICATION_ID, $applicationId)
            ->where(PlanInterface::ATTR_KEY, $key)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findAllForApplication(string $applicationId): Collection
    {
        /** @var Collection<int, Plan> $rows */
        $rows = $this->query()
            ->where(PlanInterface::ATTR_APPLICATION_ID, $applicationId)
            ->orderBy(PlanInterface::ATTR_SORT_ORDER)
            ->orderBy(PlanInterface::ATTR_KEY)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Counts subscriptions referencing this plan whose state is not
     * terminal. Uses a raw builder to bypass the plan model's soft-
     * delete scope so the count reflects live subscriptions only.
     */
    public function countActiveSubscriptions(string $planId): int
    {
        return (int) DB::table(SubscriptionInterface::TABLE)
            ->where(SubscriptionInterface::ATTR_PLAN_ID, $planId)
            ->whereNotIn(SubscriptionInterface::ATTR_STATE, [
                SubscriptionState::Cancelled->value,
                SubscriptionState::Expired->value,
            ])
            ->whereNull(SubscriptionInterface::ATTR_DELETED_AT)
            ->count();
    }
}
