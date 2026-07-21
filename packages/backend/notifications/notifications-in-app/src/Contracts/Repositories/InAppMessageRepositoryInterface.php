<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\InApp\Models\InAppMessage;
use Stackra\Notifications\InApp\Repositories\EloquentInAppMessageRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see InAppMessage}.
 *
 * Adds the inbox read paths on top of base CRUD — paginate the bell
 * list, count unread, and hard-purge past-retention rows. Consumers
 * type-hint the interface, not the concrete repository, so the
 * container can swap in a stub for tests.
 *
 * @extends RepositoryInterface<InAppMessage>
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Bind(EloquentInAppMessageRepository::class)]
interface InAppMessageRepositoryInterface extends RepositoryInterface
{
    /**
     * Every in-app message for a single addressee, newest-first.
     *
     * The `BelongsToTenant` global scope filters automatically when
     * the caller is inside a resolved tenant context. Explicit
     * addressee filter narrows to one user.
     *
     * @param  string  $tenantId     Tenant to scope by.
     * @param  string  $addresseeId  Recipient user id.
     * @param  int     $limit        Row cap for the initial page.
     * @return Collection<int, InAppMessage>
     */
    public function findForAddressee(string $tenantId, string $addresseeId, int $limit = 50): Collection;

    /**
     * Count unread messages for `$addresseeId` in `$tenantId`.
     *
     * "Unread" = no `in_app_message_reads.read_at` row exists yet
     * for the addressee against the message. Powers the bell badge.
     */
    public function countUnread(string $tenantId, string $addresseeId): int;

    /**
     * Hard-delete every message row whose `created_at` is strictly
     * before `$cutoff`. Consumers pass the tier-derived cutoff — the
     * method does not compute retention itself.
     *
     * @param  DateTimeInterface  $cutoff  Rows created before this are pruned.
     * @return int  Number of rows deleted.
     */
    public function pruneOlderThan(DateTimeInterface $cutoff): int;
}
