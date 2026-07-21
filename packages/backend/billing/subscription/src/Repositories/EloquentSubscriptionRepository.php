<?php

declare(strict_types=1);

namespace Stackra\Subscription\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Models\Subscription;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SubscriptionRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60, tags: true)]` — a short TTL because
 * subscription state can flip within a request cycle (payment
 * webhook → state transition). The observer flushes the tenant tag
 * on writes.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SubscriptionInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    SubscriptionInterface::ATTR_TENANT_ID                => ['$eq', '$in'],
    SubscriptionInterface::ATTR_APPLICATION_ID           => ['$eq', '$in'],
    SubscriptionInterface::ATTR_PLAN_ID                  => ['$eq', '$in'],
    SubscriptionInterface::ATTR_PROVIDER                 => ['$eq', '$in'],
    SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID => ['$eq'],
    SubscriptionInterface::ATTR_STATE                    => ['$eq', '$in'],
    SubscriptionInterface::ATTR_BILLING_CYCLE            => ['$eq', '$in'],
    SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END     => ['$eq'],
])]
final class EloquentSubscriptionRepository extends Repository implements SubscriptionRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findActiveForTenant(string $tenantId): ?Subscription
    {
        /** @var Subscription|null $row */
        $row = $this->query()
            ->where(SubscriptionInterface::ATTR_TENANT_ID, $tenantId)
            ->whereNotIn(SubscriptionInterface::ATTR_STATE, [
                SubscriptionState::Cancelled->value,
                SubscriptionState::Expired->value,
            ])
            ->orderByDesc(SubscriptionInterface::ATTR_CREATED_AT)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByProviderSubscriptionId(string $providerSubscriptionId): ?Subscription
    {
        /** @var Subscription|null $row */
        $row = $this->query()
            ->where(SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID, $providerSubscriptionId)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findDueForDunningAdvance(DateTimeInterface $now): Collection
    {
        /** @var Collection<int, Subscription> $rows */
        $rows = $this->query()
            ->whereIn(SubscriptionInterface::ATTR_STATE, [
                SubscriptionState::AtRisk->value,
                SubscriptionState::Grace->value,
                SubscriptionState::PastDue->value,
            ])
            ->whereNotNull(SubscriptionInterface::ATTR_GRACE_ENDS_AT)
            ->where(SubscriptionInterface::ATTR_GRACE_ENDS_AT, '<=', $now)
            ->orderBy(SubscriptionInterface::ATTR_GRACE_ENDS_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findTrialsEndingBetween(DateTimeInterface $from, DateTimeInterface $to): Collection
    {
        /** @var Collection<int, Subscription> $rows */
        $rows = $this->query()
            ->where(SubscriptionInterface::ATTR_STATE, SubscriptionState::Trialing->value)
            ->whereBetween(SubscriptionInterface::ATTR_TRIAL_ENDS_AT, [$from, $to])
            ->orderBy(SubscriptionInterface::ATTR_TRIAL_ENDS_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findTrialsExpiredBefore(DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, Subscription> $rows */
        $rows = $this->query()
            ->where(SubscriptionInterface::ATTR_STATE, SubscriptionState::Trialing->value)
            ->whereNotNull(SubscriptionInterface::ATTR_TRIAL_ENDS_AT)
            ->where(SubscriptionInterface::ATTR_TRIAL_ENDS_AT, '<=', $cutoff)
            ->orderBy(SubscriptionInterface::ATTR_TRIAL_ENDS_AT)
            ->get();

        return $rows;
    }
}
