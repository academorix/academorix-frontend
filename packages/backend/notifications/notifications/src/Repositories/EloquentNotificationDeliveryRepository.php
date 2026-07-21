<?php

declare(strict_types=1);

namespace Stackra\Notifications\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationDeliveryRepositoryInterface;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Models\NotificationDelivery;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see NotificationDeliveryRepositoryInterface}.
 *
 * Delivery rows are the audit trail of every channel attempt —
 * finders here support the reconciler + retry scheduler + admin
 * diagnostics surface.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NotificationDeliveryInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    NotificationDeliveryInterface::ATTR_TENANT_ID          => ['$eq', '$in'],
    NotificationDeliveryInterface::ATTR_NOTIFICATION_ID    => ['$eq'],
    NotificationDeliveryInterface::ATTR_CHANNEL            => ['$eq', '$in'],
    NotificationDeliveryInterface::ATTR_PROVIDER           => ['$eq', '$in'],
    NotificationDeliveryInterface::ATTR_STATE              => ['$eq', '$in'],
    NotificationDeliveryInterface::ATTR_ERROR_CODE         => ['$eq', '$in'],
    NotificationDeliveryInterface::ATTR_CREATED_AT         => ['$gte', '$lte', '$between'],
])]
final class EloquentNotificationDeliveryRepository extends Repository implements NotificationDeliveryRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByNotification(string $notificationId): Collection
    {
        /** @var Collection<int, NotificationDelivery> $rows */
        $rows = $this->query()
            ->where(NotificationDeliveryInterface::ATTR_NOTIFICATION_ID, $notificationId)
            ->orderByDesc(NotificationDeliveryInterface::ATTR_ATTEMPT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findRetryableBefore(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, NotificationDelivery> $rows */
        $rows = $this->query()
            ->whereNotNull(NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT)
            ->where(NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT, '<', $cutoff)
            ->orderBy(NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findAwaitingConfirmation(string $channel, \DateTimeInterface $since): Collection
    {
        /** @var Collection<int, NotificationDelivery> $rows */
        $rows = $this->query()
            ->where(NotificationDeliveryInterface::ATTR_CHANNEL, $channel)
            ->where(NotificationDeliveryInterface::ATTR_STATE, NotificationStatus::Sent->value)
            ->whereNull(NotificationDeliveryInterface::ATTR_DELIVERED_AT)
            ->where(NotificationDeliveryInterface::ATTR_ATTEMPTED_AT, '>=', $since)
            ->orderBy(NotificationDeliveryInterface::ATTR_ATTEMPTED_AT)
            ->get();

        return $rows;
    }
}
