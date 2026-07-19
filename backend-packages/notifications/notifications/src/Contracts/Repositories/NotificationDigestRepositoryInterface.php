<?php

declare(strict_types=1);

namespace Academorix\Notifications\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Notifications\Models\NotificationDigest;
use Academorix\Notifications\Repositories\EloquentNotificationDigestRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NotificationDigest}.
 *
 * Adds the scheduler read paths on top of base CRUD. The scheduler
 * batches per-`(user, category, channel, window)` and processes them
 * when the window boundary elapses.
 *
 * @extends RepositoryInterface<NotificationDigest>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(EloquentNotificationDigestRepository::class)]
interface NotificationDigestRepositoryInterface extends RepositoryInterface
{
    /**
     * Every pending digest whose `scheduled_for` lies at or before `$cutoff`.
     *
     * @return Collection<int, NotificationDigest>
     */
    public function findDueBefore(\DateTimeInterface $cutoff): Collection;

    /**
     * Find or lazily create the digest bucket for the tuple.
     */
    public function findOrCreateBucket(
        string $tenantId,
        string $userId,
        string $categorySlug,
        string $channel,
        \DateTimeInterface $scheduledFor,
    ): NotificationDigest;
}
