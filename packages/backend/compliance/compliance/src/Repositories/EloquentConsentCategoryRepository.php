<?php

declare(strict_types=1);

namespace Stackra\Compliance\Repositories;

use Stackra\Compliance\Contracts\Data\ConsentCategoryInterface;
use Stackra\Compliance\Contracts\Repositories\ConsentCategoryRepositoryInterface;
use Stackra\Compliance\Models\ConsentCategory;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see ConsentCategoryRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(ConsentCategoryInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    ConsentCategoryInterface::ATTR_TENANT_ID => ['$eq', '$in'],
    ConsentCategoryInterface::ATTR_KEY       => ['$eq'],
    ConsentCategoryInterface::ATTR_IS_SYSTEM => ['$eq'],
])]
final class EloquentConsentCategoryRepository extends Repository implements ConsentCategoryRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Returns the union of platform defaults (`tenant_id = null`)
     * and the tenant's own overrides. Tenant overrides shadow the
     * defaults on matching keys via `findByKey`.
     */
    public function findVisibleForTenant(string $tenantId): Collection
    {
        /** @var Collection<int, ConsentCategory> $rows */
        $rows = $this->query()
            ->where(function ($q) use ($tenantId): void {
                $q->whereNull(ConsentCategoryInterface::ATTR_TENANT_ID)
                    ->orWhere(ConsentCategoryInterface::ATTR_TENANT_ID, $tenantId);
            })
            ->orderBy(ConsentCategoryInterface::ATTR_KEY)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * Tenant override wins over the platform default when both
     * exist.
     */
    public function findByKey(string $tenantId, string $key): ?ConsentCategory
    {
        /** @var ConsentCategory|null $override */
        $override = $this->query()
            ->where(ConsentCategoryInterface::ATTR_TENANT_ID, $tenantId)
            ->where(ConsentCategoryInterface::ATTR_KEY, $key)
            ->first();

        if ($override !== null) {
            return $override;
        }

        /** @var ConsentCategory|null $default */
        $default = $this->query()
            ->whereNull(ConsentCategoryInterface::ATTR_TENANT_ID)
            ->where(ConsentCategoryInterface::ATTR_KEY, $key)
            ->first();

        return $default;
    }
}
