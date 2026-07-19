<?php

declare(strict_types=1);

namespace Academorix\Notifications\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Notifications\Models\NotificationPreference;
use Academorix\Notifications\Repositories\EloquentNotificationPreferenceRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NotificationPreference}.
 *
 * Adds the resolver read paths on top of base CRUD. The dispatch
 * pipeline consults the per-user preference to decide whether a
 * channel is enabled + whether to defer to a digest.
 *
 * @extends RepositoryInterface<NotificationPreference>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(EloquentNotificationPreferenceRepository::class)]
interface NotificationPreferenceRepositoryInterface extends RepositoryInterface
{
    /**
     * Every preference row owned by a user (across every category).
     *
     * @return Collection<int, NotificationPreference>
     */
    public function findByUser(string $tenantId, string $userId): Collection;

    /**
     * Find the row for `(tenant, user, category, channel)`.
     */
    public function findByTuple(
        string $tenantId,
        string $userId,
        string $categorySlug,
        string $channel,
    ): ?NotificationPreference;
}
