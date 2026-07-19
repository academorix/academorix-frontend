<?php

declare(strict_types=1);

namespace Academorix\Subscription\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionEventRepositoryInterface;
use Academorix\Subscription\Models\SubscriptionEvent;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SubscriptionEventRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 300, tags: true)]` — the feed is append-only so
 * a 5-minute TTL is safe. New rows land ordered by `occurred_at`
 * so the cache surfaces them on the next TTL boundary.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SubscriptionEventInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    SubscriptionEventInterface::ATTR_TENANT_ID         => ['$eq', '$in'],
    SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID   => ['$eq'],
    SubscriptionEventInterface::ATTR_KIND              => ['$eq', '$in'],
    SubscriptionEventInterface::ATTR_ACTOR_TYPE        => ['$eq', '$in'],
    SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID => ['$eq'],
    SubscriptionEventInterface::ATTR_OCCURRED_AT       => ['$gte', '$lte', '$between'],
])]
final class EloquentSubscriptionEventRepository extends Repository implements SubscriptionEventRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySubscription(string $subscriptionId): Collection
    {
        /** @var Collection<int, SubscriptionEvent> $rows */
        $rows = $this->query()
            ->where(SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID, $subscriptionId)
            ->orderByDesc(SubscriptionEventInterface::ATTR_OCCURRED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByProviderEventId(string $providerEventId): ?SubscriptionEvent
    {
        /** @var SubscriptionEvent|null $row */
        $row = $this->query()
            ->where(SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID, $providerEventId)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId, int $limit = 100): Collection
    {
        /** @var Collection<int, SubscriptionEvent> $rows */
        $rows = $this->query()
            ->where(SubscriptionEventInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(SubscriptionEventInterface::ATTR_OCCURRED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }
}
