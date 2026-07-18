<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterIssueStatus;
use Academorix\Newsletter\Models\NewsletterIssue;
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
