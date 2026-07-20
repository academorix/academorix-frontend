<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Models\Newsletter;

/**
 * Eloquent implementation of {@see NewsletterRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 300)]` — newsletter rows change rarely (edit
 * flows are admin-triggered) so a five-minute cache smooths the hot
 * read paths (subscribe page render, send-scheduled scan).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NewsletterInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    NewsletterInterface::ATTR_TENANT_ID => ['$eq', '$in'],
    NewsletterInterface::ATTR_STATUS    => ['$eq', '$in'],
    NewsletterInterface::ATTR_CADENCE   => ['$eq', '$in'],
    NewsletterInterface::ATTR_SLUG      => ['$eq'],
])]
final class EloquentNewsletterRepository extends Repository implements NewsletterRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySlug(string $tenantId, string $slug): ?Newsletter
    {
        /** @var Newsletter|null $row */
        $row = $this->query()
            ->where(NewsletterInterface::ATTR_TENANT_ID, $tenantId)
            ->where(NewsletterInterface::ATTR_SLUG, $slug)
            ->first();

        return $row;
    }
}
