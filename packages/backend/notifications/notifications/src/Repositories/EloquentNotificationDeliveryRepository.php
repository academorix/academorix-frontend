<?php

declare(strict_types=1);

namespace Academorix\Notifications\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Academorix\Notifications\Contracts\Repositories\NotificationDeliveryRepositoryInterface;
use Academorix\Notifications\Enums\NotificationStatus;
use Academorix\Notifications\Models\NotificationDelivery;
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
