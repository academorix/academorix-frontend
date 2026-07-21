<?php

declare(strict_types=1);

namespace Stackra\Branding\Repositories;

use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Models\Branding;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see BrandingRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — 1-hour TTL with tag-based
 * invalidation. The observer flushes tags on every write so readers
 * see stable snapshots but writes propagate immediately.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(BrandingInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    BrandingInterface::ATTR_TENANT_ID  => ['$eq', '$in'],
    BrandingInterface::ATTR_DOMAIN_ID  => ['$eq', '$in', '$null'],
    BrandingInterface::ATTR_THEME      => ['$eq', '$in'],
    BrandingInterface::ATTR_IS_DEFAULT => ['$eq'],
])]
final class EloquentBrandingRepository extends Repository implements BrandingRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findDefaultForTenant(string $tenantId): ?Branding
    {
        /** @var Branding|null $row */
        $row = $this->query()
            ->where(BrandingInterface::ATTR_TENANT_ID, $tenantId)
            ->where(BrandingInterface::ATTR_IS_DEFAULT, true)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findForDomain(string $tenantId, string $domainId): ?Branding
    {
        /** @var Branding|null $row */
        $row = $this->query()
            ->where(BrandingInterface::ATTR_TENANT_ID, $tenantId)
            ->where(BrandingInterface::ATTR_DOMAIN_ID, $domainId)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, Branding> $rows */
        $rows = $this->query()
            ->where(BrandingInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(BrandingInterface::ATTR_IS_DEFAULT)
            ->orderBy(BrandingInterface::ATTR_NAME)
            ->get();

        return $rows;
    }
}
