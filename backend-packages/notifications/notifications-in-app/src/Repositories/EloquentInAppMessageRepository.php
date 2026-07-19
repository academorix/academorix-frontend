<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Academorix\Notifications\InApp\Contracts\Repositories\InAppMessageRepositoryInterface;
use Academorix\Notifications\InApp\Models\InAppMessage;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see InAppMessageRepositoryInterface}.
 *
 * ## What this class owns
 *
 * Hot-path finders the bell UI + the retention pruner rely on:
 *
 *   - {@see findForAddressee()} — inbox pagination.
 *   - {@see countUnread()}      — badge count.
 *   - {@see pruneOlderThan()}   — retention hard-delete.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60)]` — short TTL. The bell UI polls the inbox
 * on tab focus + on the 30-second window; a 60-second cache catches
 * the common polling cadence without staleness spilling past a
 * refresh.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(InAppMessageInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    InAppMessageInterface::ATTR_TENANT_ID       => ['$eq', '$in'],
    InAppMessageInterface::ATTR_ADDRESSEE_ID    => ['$eq', '$in'],
    InAppMessageInterface::ATTR_ADDRESSEE_TYPE  => ['$eq'],
    InAppMessageInterface::ATTR_CATEGORY_SLUG   => ['$eq', '$in'],
    InAppMessageInterface::ATTR_PRIORITY        => ['$eq', '$in'],
    InAppMessageInterface::ATTR_NOTIFICATION_ID => ['$eq'],
    InAppMessageInterface::ATTR_CREATED_AT      => ['$gte', '$lte', '$between'],
])]
final class EloquentInAppMessageRepository extends Repository implements InAppMessageRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findForAddressee(string $tenantId, string $addresseeId, int $limit = 50): Collection
    {
        /** @var Collection<int, InAppMessage> $rows */
        $rows = $this->query()
            ->where(InAppMessageInterface::ATTR_TENANT_ID, $tenantId)
            ->where(InAppMessageInterface::ATTR_ADDRESSEE_ID, $addresseeId)
            ->orderByDesc(InAppMessageInterface::ATTR_CREATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Left-join to the `in_app_message_reads` sibling table filtered
     * by `addressee_id` — a message is unread when the join returns
     * NULL for `read_at`. Kept as a raw expression rather than an
     * Eloquent relation because the aggregate is a plain count, not
     * a hydrated collection.
     */
    public function countUnread(string $tenantId, string $addresseeId): int
    {
        return $this->query()
            ->where(
                InAppMessageInterface::TABLE . '.' . InAppMessageInterface::ATTR_TENANT_ID,
                $tenantId,
            )
            ->where(
                InAppMessageInterface::TABLE . '.' . InAppMessageInterface::ATTR_ADDRESSEE_ID,
                $addresseeId,
            )
            ->leftJoin(
                InAppMessageReadInterface::TABLE,
                function ($join) use ($addresseeId): void {
                    $join->on(
                        InAppMessageReadInterface::TABLE . '.' . InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID,
                        '=',
                        InAppMessageInterface::TABLE . '.' . InAppMessageInterface::ATTR_ID,
                    )->where(
                        InAppMessageReadInterface::TABLE . '.' . InAppMessageReadInterface::ATTR_ADDRESSEE_ID,
                        '=',
                        $addresseeId,
                    );
                },
            )
            ->whereNull(
                InAppMessageReadInterface::TABLE . '.' . InAppMessageReadInterface::ATTR_READ_AT,
            )
            ->count();
    }

    /**
     * {@inheritDoc}
     *
     * Hard-delete — the read-state cascade takes the sibling rows
     * with it via the FK constraint on `in_app_message_reads`.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(InAppMessageInterface::ATTR_CREATED_AT, '<', $cutoff)
            ->delete();
    }
}
