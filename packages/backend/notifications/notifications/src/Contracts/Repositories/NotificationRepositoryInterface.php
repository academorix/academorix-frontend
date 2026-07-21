<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Repositories\EloquentNotificationRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Notification}.
 *
 * Adds the domain finders the inbox surface + retention job + platform
 * cross-tenant surface need on top of the base CRUD.
 *
 * @extends RepositoryInterface<Notification>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(EloquentNotificationRepository::class)]
interface NotificationRepositoryInterface extends RepositoryInterface
{
    /**
     * Paginate the caller's inbox for a specific addressee. Newest first.
     *
     * @return LengthAwarePaginator<int, Notification>
     */
    public function paginateInboxFor(string $tenantId, string $addresseeId, int $perPage = 25): LengthAwarePaginator;

    /**
     * Every archived notification whose `archived_at` is older than
     * `$cutoff` — the retention job read path.
     *
     * @return Collection<int, Notification>
     */
    public function findArchivedBefore(\DateTimeInterface $cutoff): Collection;

    /**
     * Count unseen notifications for `$addresseeId` in `$tenantId`.
     */
    public function countUnseen(string $tenantId, string $addresseeId): int;
}
