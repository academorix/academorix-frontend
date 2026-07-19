<?php

declare(strict_types=1);

namespace Academorix\Branding\Repositories;

use Academorix\Branding\Contracts\Data\BrandingInterface;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Models\Branding;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
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
