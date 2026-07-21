<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Stackra\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Stackra\Notifications\InApp\Contracts\Repositories\InAppMessageReadRepositoryInterface;
use Stackra\Notifications\InApp\Models\InAppMessageRead;
use Illuminate\Support\Facades\DB;

/**
 * Eloquent implementation of
 * {@see InAppMessageReadRepositoryInterface}.
 *
 * NOT cached — read-state changes must reach the DB immediately so
 * the badge + unread-count cache invalidation is deterministic. Cache
 * layer above (unread-count endpoint) handles the read-side cache.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(InAppMessageReadInterface::class)]
#[Filterable([
    InAppMessageReadInterface::ATTR_TENANT_ID         => ['$eq', '$in'],
    InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID => ['$eq', '$in'],
    InAppMessageReadInterface::ATTR_ADDRESSEE_ID      => ['$eq'],
])]
final class EloquentInAppMessageReadRepository extends Repository implements InAppMessageReadRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findForMessage(string $inAppMessageId, string $addresseeId): ?InAppMessageRead
    {
        /** @var InAppMessageRead|null $row */
        $row = $this->query()
            ->where(InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID, $inAppMessageId)
            ->where(InAppMessageReadInterface::ATTR_ADDRESSEE_ID, $addresseeId)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     *
     * Idempotent — the compound-unique index on
     * `(in_app_message_id, addressee_id)` makes `updateOrCreate` the
     * canonical seam. On the second call, the row already exists +
     * `read_at` is preserved (never overwritten by a fresh timestamp
     * — first-view wins, matching the audit trail semantics).
     */
    public function markRead(
        string $tenantId,
        string $inAppMessageId,
        string $addresseeId,
        string $addresseeType,
    ): InAppMessageRead {
        /** @var InAppMessageRead $row */
        $row = $this->newQuery()->updateOrCreate(
            [
                InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID => $inAppMessageId,
                InAppMessageReadInterface::ATTR_ADDRESSEE_ID      => $addresseeId,
            ],
            [
                InAppMessageReadInterface::ATTR_TENANT_ID      => $tenantId,
                InAppMessageReadInterface::ATTR_ADDRESSEE_TYPE => $addresseeType,
                InAppMessageReadInterface::ATTR_READ_AT        => \now(),
            ],
        );

        return $row;
    }

    /**
     * {@inheritDoc}
     *
     * Runs the write in a transaction so the fan-out is atomic — a
     * partial mark-all-read would break the invariant that the
     * unread-count cache invalidation matches DB state.
     *
     * Strategy: SELECT every un-read message for the addressee, then
     * upsert one read-state row per message. The upsert is idempotent
     * so an in-flight mark-read from another tab is safe.
     */
    public function markAllRead(string $tenantId, string $addresseeId, string $addresseeType): int
    {
        return (int) DB::transaction(function () use ($tenantId, $addresseeId, $addresseeType): int {
            // Every message the addressee owns where no read-state
            // row already carries `read_at`.
            $unreadIds = DB::table(InAppMessageInterface::TABLE)
                ->select(
                    InAppMessageInterface::TABLE . '.' . InAppMessageInterface::ATTR_ID,
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
                ->where(
                    InAppMessageInterface::TABLE . '.' . InAppMessageInterface::ATTR_TENANT_ID,
                    $tenantId,
                )
                ->where(
                    InAppMessageInterface::TABLE . '.' . InAppMessageInterface::ATTR_ADDRESSEE_ID,
                    $addresseeId,
                )
                ->whereNull(
                    InAppMessageReadInterface::TABLE . '.' . InAppMessageReadInterface::ATTR_READ_AT,
                )
                ->pluck(InAppMessageInterface::ATTR_ID);

            $count = 0;
            foreach ($unreadIds as $messageId) {
                $this->markRead($tenantId, (string) $messageId, $addresseeId, $addresseeType);
                $count++;
            }

            return $count;
        });
    }
}
