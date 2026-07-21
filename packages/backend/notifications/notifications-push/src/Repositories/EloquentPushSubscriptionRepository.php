<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Models\PushSubscription;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see PushSubscriptionRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60, tags: true)]` — short TTL because active-status can
 * flip on any provider invalid-token report. The observer flushes the tenant
 * tags on writes so dispatch sees the new state immediately.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(PushSubscriptionInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    PushSubscriptionInterface::ATTR_TENANT_ID      => ['$eq', '$in'],
    PushSubscriptionInterface::ATTR_APPLICATION_ID => ['$eq', '$in'],
    PushSubscriptionInterface::ATTR_USER_ID        => ['$eq'],
    PushSubscriptionInterface::ATTR_PROVIDER       => ['$eq', '$in'],
    PushSubscriptionInterface::ATTR_PLATFORM       => ['$eq', '$in'],
    PushSubscriptionInterface::ATTR_IS_ACTIVE      => ['$eq'],
    PushSubscriptionInterface::ATTR_LAST_SEEN_AT   => ['$gte', '$lte', '$between'],
])]
final class EloquentPushSubscriptionRepository extends Repository implements PushSubscriptionRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findActiveForUserAndApplication(string $userId, string $applicationId): Collection
    {
        /** @var Collection<int, PushSubscription> $rows */
        $rows = $this->query()
            ->where(PushSubscriptionInterface::ATTR_USER_ID, $userId)
            ->where(PushSubscriptionInterface::ATTR_APPLICATION_ID, $applicationId)
            ->where(PushSubscriptionInterface::ATTR_IS_ACTIVE, true)
            ->whereNull(PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByFingerprint(string $userId, string $applicationId, string $fingerprint): ?PushSubscription
    {
        /** @var PushSubscription|null $row */
        $row = $this->query()
            ->where(PushSubscriptionInterface::ATTR_USER_ID, $userId)
            ->where(PushSubscriptionInterface::ATTR_APPLICATION_ID, $applicationId)
            ->where(PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT, $fingerprint)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findIdleBefore(DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, PushSubscription> $rows */
        $rows = $this->query()
            ->where(function ($query) use ($cutoff): void {
                $query
                    ->whereNull(PushSubscriptionInterface::ATTR_LAST_SEEN_AT)
                    ->orWhere(PushSubscriptionInterface::ATTR_LAST_SEEN_AT, '<', $cutoff);
            })
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByUser(string $userId): Collection
    {
        /** @var Collection<int, PushSubscription> $rows */
        $rows = $this->query()
            ->where(PushSubscriptionInterface::ATTR_USER_ID, $userId)
            ->get();

        return $rows;
    }
}
