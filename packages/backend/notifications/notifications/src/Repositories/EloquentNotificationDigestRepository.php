<?php

declare(strict_types=1);

namespace Stackra\Notifications\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Contracts\Data\NotificationDigestInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationDigestRepositoryInterface;
use Stackra\Notifications\Enums\DigestState;
use Stackra\Notifications\Models\NotificationDigest;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Eloquent implementation of {@see NotificationDigestRepositoryInterface}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NotificationDigestInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    NotificationDigestInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    NotificationDigestInterface::ATTR_USER_ID       => ['$eq'],
    NotificationDigestInterface::ATTR_CATEGORY_SLUG => ['$eq', '$in'],
    NotificationDigestInterface::ATTR_CHANNEL       => ['$eq', '$in'],
    NotificationDigestInterface::ATTR_STATE         => ['$eq', '$in'],
    NotificationDigestInterface::ATTR_SCHEDULED_FOR => ['$gte', '$lte', '$between'],
])]
final class EloquentNotificationDigestRepository extends Repository implements NotificationDigestRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findDueBefore(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, NotificationDigest> $rows */
        $rows = $this->query()
            ->where(NotificationDigestInterface::ATTR_STATE, DigestState::Pending->value)
            ->where(NotificationDigestInterface::ATTR_SCHEDULED_FOR, '<=', $cutoff)
            ->orderBy(NotificationDigestInterface::ATTR_SCHEDULED_FOR)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findOrCreateBucket(
        string $tenantId,
        string $userId,
        string $categorySlug,
        string $channel,
        \DateTimeInterface $scheduledFor,
    ): NotificationDigest {
        /** @var NotificationDigest|null $existing */
        $existing = $this->query()
            ->where(NotificationDigestInterface::ATTR_TENANT_ID, $tenantId)
            ->where(NotificationDigestInterface::ATTR_USER_ID, $userId)
            ->where(NotificationDigestInterface::ATTR_CATEGORY_SLUG, $categorySlug)
            ->where(NotificationDigestInterface::ATTR_CHANNEL, $channel)
            ->where(NotificationDigestInterface::ATTR_STATE, DigestState::Pending->value)
            ->where(NotificationDigestInterface::ATTR_SCHEDULED_FOR, $scheduledFor)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        /** @var NotificationDigest $created */
        $created = $this->query()->create([
            NotificationDigestInterface::ATTR_ID               => 'dgst_' . Str::ulid()->toBase32(),
            NotificationDigestInterface::ATTR_TENANT_ID        => $tenantId,
            NotificationDigestInterface::ATTR_USER_ID          => $userId,
            NotificationDigestInterface::ATTR_CATEGORY_SLUG    => $categorySlug,
            NotificationDigestInterface::ATTR_CHANNEL          => $channel,
            NotificationDigestInterface::ATTR_STATE            => DigestState::Pending->value,
            NotificationDigestInterface::ATTR_SCHEDULED_FOR    => $scheduledFor,
            NotificationDigestInterface::ATTR_NOTIFICATION_IDS => [],
        ]);

        return $created;
    }
}
