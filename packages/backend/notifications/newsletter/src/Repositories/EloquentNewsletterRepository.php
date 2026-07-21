<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Models\Newsletter;

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
