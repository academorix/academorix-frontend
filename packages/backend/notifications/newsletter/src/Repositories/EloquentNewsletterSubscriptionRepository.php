<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterSubscriptionStatus;
use Academorix\Newsletter\Models\NewsletterSubscription;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see NewsletterSubscriptionRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 30)]` — very short TTL. Subscription state
 * flips on user action (confirm / unsubscribe) and the campaign
 * orchestrator MUST see the fresh state.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NewsletterSubscriptionInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    NewsletterSubscriptionInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID => ['$eq', '$in'],
    NewsletterSubscriptionInterface::ATTR_STATUS        => ['$eq', '$in'],
    NewsletterSubscriptionInterface::ATTR_SOURCE        => ['$eq', '$in'],
    NewsletterSubscriptionInterface::ATTR_EMAIL         => ['$eq'],
    NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT => ['$gte', '$lte', '$between'],
])]
final class EloquentNewsletterSubscriptionRepository extends Repository implements NewsletterSubscriptionRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByEmail(string $newsletterId, string $email): ?NewsletterSubscription
    {
        /** @var NewsletterSubscription|null $row */
        $row = $this->query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterSubscriptionInterface::ATTR_EMAIL, \strtolower(\trim($email)))
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByConfirmationToken(string $token): ?NewsletterSubscription
    {
        /** @var NewsletterSubscription|null $row */
        $row = $this->query()
            ->where(NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN, $token)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByUnsubscribeToken(string $token): ?NewsletterSubscription
    {
        /** @var NewsletterSubscription|null $row */
        $row = $this->query()
            ->where(NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN, $token)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     *
     * Uses a `LIKE` on the JSON `tags` column for cross-database
     * portability. Postgres GIN + SQLite JSON contains both handle
     * the substring match.
     */
    public function findActiveWithTag(string $newsletterId, string $tag): Collection
    {
        $needle = \sprintf('"%s"', $tag);

        /** @var Collection<int, NewsletterSubscription> $rows */
        $rows = $this->query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterSubscriptionInterface::ATTR_STATUS, NewsletterSubscriptionStatus::Active->value)
            ->where(NewsletterSubscriptionInterface::ATTR_TAGS, 'like', '%' . $needle . '%')
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findAllActive(string $newsletterId): Collection
    {
        /** @var Collection<int, NewsletterSubscription> $rows */
        $rows = $this->query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterSubscriptionInterface::ATTR_STATUS, NewsletterSubscriptionStatus::Active->value)
            ->orderBy(NewsletterSubscriptionInterface::ATTR_ID)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findExpiredPending(string $newsletterId, DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, NewsletterSubscription> $rows */
        $rows = $this->query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterSubscriptionInterface::ATTR_STATUS, NewsletterSubscriptionStatus::PendingConfirmation->value)
            ->where(NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT, '<=', $cutoff)
            ->get();

        return $rows;
    }
}
