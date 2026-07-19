<?php

declare(strict_types=1);

namespace Academorix\Notifications\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Notifications\Contracts\Data\NotificationInterface;
use Academorix\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Academorix\Notifications\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see NotificationRepositoryInterface}.
 *
 * ## Attribute-first wiring
 *
 * `#[AsRepository]` — pre-resolves configuration at boot (Octane-safe).
 * `#[UseModel(NotificationInterface::class)]` — resolves the concrete
 *   model through the interface's `#[Bind]`.
 * `#[Cacheable(ttl: 30, tags: true)]` — 30s TTL keeps inbox reads
 *   fast; observer invalidations flush the tag on state transitions.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NotificationInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    NotificationInterface::ATTR_TENANT_ID       => ['$eq', '$in'],
    NotificationInterface::ATTR_APPLICATION_ID  => ['$eq', '$in'],
    NotificationInterface::ATTR_CATEGORY_SLUG   => ['$eq', '$in'],
    NotificationInterface::ATTR_ADDRESSEE_ID    => ['$eq'],
    NotificationInterface::ATTR_ADDRESSEE_TYPE  => ['$eq'],
    NotificationInterface::ATTR_PRIORITY        => ['$eq', '$in'],
    NotificationInterface::ATTR_STATE           => ['$eq', '$in'],
    NotificationInterface::ATTR_SEEN_AT         => ['$null', '$notnull'],
    NotificationInterface::ATTR_ARCHIVED_AT     => ['$null', '$notnull'],
    NotificationInterface::ATTR_CREATED_AT      => ['$gte', '$lte', '$between'],
])]
final class EloquentNotificationRepository extends Repository implements NotificationRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function paginateInboxFor(string $tenantId, string $addresseeId, int $perPage = 25): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Notification> $rows */
        $rows = $this->query()
            ->where(NotificationInterface::ATTR_TENANT_ID, $tenantId)
            ->where(NotificationInterface::ATTR_ADDRESSEE_ID, $addresseeId)
            ->whereNull(NotificationInterface::ATTR_ARCHIVED_AT)
            ->orderByDesc(NotificationInterface::ATTR_CREATED_AT)
            ->paginate($perPage);

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findArchivedBefore(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, Notification> $rows */
        $rows = $this->query()
            ->whereNotNull(NotificationInterface::ATTR_ARCHIVED_AT)
            ->where(NotificationInterface::ATTR_ARCHIVED_AT, '<', $cutoff)
            ->orderBy(NotificationInterface::ATTR_ARCHIVED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function countUnseen(string $tenantId, string $addresseeId): int
    {
        return (int) $this->query()
            ->where(NotificationInterface::ATTR_TENANT_ID, $tenantId)
            ->where(NotificationInterface::ATTR_ADDRESSEE_ID, $addresseeId)
            ->whereNull(NotificationInterface::ATTR_SEEN_AT)
            ->whereNull(NotificationInterface::ATTR_ARCHIVED_AT)
            ->count();
    }
}
