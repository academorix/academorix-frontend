<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Stackra\Newsletter\Enums\NewsletterIssueStatus;
use Stackra\Newsletter\Models\NewsletterIssue;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see NewsletterIssueRepositoryInterface}.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NewsletterIssueInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    NewsletterIssueInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    NewsletterIssueInterface::ATTR_NEWSLETTER_ID => ['$eq', '$in'],
    NewsletterIssueInterface::ATTR_STATUS        => ['$eq', '$in'],
    NewsletterIssueInterface::ATTR_SCHEDULED_AT  => ['$gte', '$lte', '$between'],
])]
final class EloquentNewsletterIssueRepository extends Repository implements NewsletterIssueRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findForNewsletter(string $newsletterId, int $limit = 100): Collection
    {
        /** @var Collection<int, NewsletterIssue> $rows */
        $rows = $this->query()
            ->where(NewsletterIssueInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->orderByDesc(NewsletterIssueInterface::ATTR_CREATED_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findDueForSend(DateTimeInterface $now): Collection
    {
        /** @var Collection<int, NewsletterIssue> $rows */
        $rows = $this->query()
            ->where(NewsletterIssueInterface::ATTR_STATUS, NewsletterIssueStatus::Scheduled->value)
            ->where(NewsletterIssueInterface::ATTR_SCHEDULED_AT, '<=', $now)
            ->orderBy(NewsletterIssueInterface::ATTR_SCHEDULED_AT)
            ->get();

        return $rows;
    }
}
