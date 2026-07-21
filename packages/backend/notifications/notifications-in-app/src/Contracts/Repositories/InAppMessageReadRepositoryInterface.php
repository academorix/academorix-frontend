<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\InApp\Models\InAppMessageRead;
use Stackra\Notifications\InApp\Repositories\EloquentInAppMessageReadRepository;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see InAppMessageRead}.
 *
 * Adds the mark-read / mark-all-read finder + upserter on top of
 * base CRUD. Mark operations are idempotent — a second mark-read
 * against the same message is a no-op that still returns the row.
 *
 * @extends RepositoryInterface<InAppMessageRead>
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Bind(EloquentInAppMessageReadRepository::class)]
interface InAppMessageReadRepositoryInterface extends RepositoryInterface
{
    /**
     * Find the read-state row for a single `(message, addressee)`
     * tuple. Returns `null` when the addressee has never viewed the
     * message.
     */
    public function findForMessage(string $inAppMessageId, string $addresseeId): ?InAppMessageRead;

    /**
     * Mark a message read for one addressee. Idempotent — the second
     * call is a no-op that still returns the persisted row.
     *
     * @param  string  $tenantId          Active tenant.
     * @param  string  $inAppMessageId    Target message id.
     * @param  string  $addresseeId       Reader id.
     * @param  string  $addresseeType     Polymorphic addressee type.
     */
    public function markRead(
        string $tenantId,
        string $inAppMessageId,
        string $addresseeId,
        string $addresseeType,
    ): InAppMessageRead;

    /**
     * Mark every unread message for `$addresseeId` in `$tenantId` as
     * read. Returns the count of rows newly-marked (idempotent —
     * already-read rows are NOT counted).
     */
    public function markAllRead(string $tenantId, string $addresseeId, string $addresseeType): int;
}
