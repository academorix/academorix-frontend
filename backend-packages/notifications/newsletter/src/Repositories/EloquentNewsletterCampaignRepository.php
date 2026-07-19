<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterCampaignStatus;
use Academorix\Newsletter\Models\NewsletterCampaign;
use DateTimeInterface;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see NewsletterCampaignRepositoryInterface}.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NewsletterCampaignInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    NewsletterCampaignInterface::ATTR_TENANT_ID     => ['$eq', '$in'],
    NewsletterCampaignInterface::ATTR_NEWSLETTER_ID => ['$eq', '$in'],
    NewsletterCampaignInterface::ATTR_ISSUE_ID      => ['$eq'],
    NewsletterCampaignInterface::ATTR_AUDIENCE_ID   => ['$eq'],
    NewsletterCampaignInterface::ATTR_STATUS        => ['$eq', '$in'],
    NewsletterCampaignInterface::ATTR_SCHEDULED_AT  => ['$gte', '$lte', '$between'],
])]
final class EloquentNewsletterCampaignRepository extends Repository implements NewsletterCampaignRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findDueForSend(DateTimeInterface $now): Collection
    {
        /** @var Collection<int, NewsletterCampaign> $rows */
        $rows = $this->query()
            ->where(NewsletterCampaignInterface::ATTR_STATUS, NewsletterCampaignStatus::Pending->value)
            ->where(NewsletterCampaignInterface::ATTR_SCHEDULED_AT, '<=', $now)
            ->orderBy(NewsletterCampaignInterface::ATTR_SCHEDULED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findCompletedInWindow(string $newsletterId, DateTimeInterface $since): Collection
    {
        /** @var Collection<int, NewsletterCampaign> $rows */
        $rows = $this->query()
            ->where(NewsletterCampaignInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterCampaignInterface::ATTR_STATUS, NewsletterCampaignStatus::Completed->value)
            ->where(NewsletterCampaignInterface::ATTR_COMPLETED_AT, '>=', $since)
            ->orderByDesc(NewsletterCampaignInterface::ATTR_COMPLETED_AT)
            ->get();

        return $rows;
    }
}
