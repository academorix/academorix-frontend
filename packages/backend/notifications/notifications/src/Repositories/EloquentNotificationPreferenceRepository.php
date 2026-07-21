<?php

declare(strict_types=1);

namespace Stackra\Notifications\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationPreferenceRepositoryInterface;
use Stackra\Notifications\Models\NotificationPreference;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see NotificationPreferenceRepositoryInterface}.
 *
 * Preference reads are hot-path — the dispatch gateway consults them
 * for every emitted notification. `#[Cacheable(ttl: 600)]` keeps
 * the load off the DB while observer invalidations flush the tag
 * on writes.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NotificationPreferenceInterface::class)]
#[Cacheable(ttl: 600, tags: true)]
#[Filterable([
    NotificationPreferenceInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    NotificationPreferenceInterface::ATTR_USER_ID       => ['$eq'],
    NotificationPreferenceInterface::ATTR_CATEGORY_SLUG => ['$eq', '$in'],
    NotificationPreferenceInterface::ATTR_CHANNEL       => ['$eq', '$in'],
    NotificationPreferenceInterface::ATTR_ENABLED       => ['$eq'],
    NotificationPreferenceInterface::ATTR_DIGEST_MODE   => ['$eq', '$in'],
])]
final class EloquentNotificationPreferenceRepository extends Repository implements NotificationPreferenceRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByUser(string $tenantId, string $userId): Collection
    {
        /** @var Collection<int, NotificationPreference> $rows */
        $rows = $this->query()
            ->where(NotificationPreferenceInterface::ATTR_TENANT_ID, $tenantId)
            ->where(NotificationPreferenceInterface::ATTR_USER_ID, $userId)
            ->orderBy(NotificationPreferenceInterface::ATTR_CATEGORY_SLUG)
            ->orderBy(NotificationPreferenceInterface::ATTR_CHANNEL)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTuple(
        string $tenantId,
        string $userId,
        string $categorySlug,
        string $channel,
    ): ?NotificationPreference {
        /** @var NotificationPreference|null $row */
        $row = $this->query()
            ->where(NotificationPreferenceInterface::ATTR_TENANT_ID, $tenantId)
            ->where(NotificationPreferenceInterface::ATTR_USER_ID, $userId)
            ->where(NotificationPreferenceInterface::ATTR_CATEGORY_SLUG, $categorySlug)
            ->where(NotificationPreferenceInterface::ATTR_CHANNEL, $channel)
            ->first();

        return $row;
    }
}
