<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Models\NewsletterAudience;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see NewsletterAudienceRepositoryInterface}.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NewsletterAudienceInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    NewsletterAudienceInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    NewsletterAudienceInterface::ATTR_NEWSLETTER_ID => ['$eq', '$in'],
    NewsletterAudienceInterface::ATTR_IS_DEFAULT    => ['$eq'],
    NewsletterAudienceInterface::ATTR_SLUG          => ['$eq'],
])]
final class EloquentNewsletterAudienceRepository extends Repository implements NewsletterAudienceRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findForNewsletter(string $newsletterId): Collection
    {
        /** @var Collection<int, NewsletterAudience> $rows */
        $rows = $this->query()
            ->where(NewsletterAudienceInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->orderByDesc(NewsletterAudienceInterface::ATTR_IS_DEFAULT)
            ->orderBy(NewsletterAudienceInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findDefaultForNewsletter(string $newsletterId): ?NewsletterAudience
    {
        /** @var NewsletterAudience|null $row */
        $row = $this->query()
            ->where(NewsletterAudienceInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterAudienceInterface::ATTR_IS_DEFAULT, true)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     *
     * A `null` cache_refreshed_at counts as stale so the audience
     * builder rebuilds an audience that has never been evaluated.
     */
    public function findStaleCaches(int $maxAgeSeconds): Collection
    {
        $cutoff = \now()->subSeconds($maxAgeSeconds);

        /** @var Collection<int, NewsletterAudience> $rows */
        $rows = $this->query()
            ->where(function ($query) use ($cutoff): void {
                $query
                    ->whereNull(NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT)
                    ->orWhere(NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT, '<', $cutoff);
            })
            ->get();

        return $rows;
    }
}
