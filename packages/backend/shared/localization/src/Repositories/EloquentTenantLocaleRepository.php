<?php

declare(strict_types=1);

namespace Stackra\Localization\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Localization\Contracts\Data\TenantLocaleInterface;
use Stackra\Localization\Contracts\Repositories\TenantLocaleRepositoryInterface;
use Stackra\Localization\Models\TenantLocale;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see TenantLocaleRepositoryInterface}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TenantLocaleInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    TenantLocaleInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    TenantLocaleInterface::ATTR_LANGUAGE_ID  => ['$eq', '$in'],
    TenantLocaleInterface::ATTR_IS_DEFAULT   => ['$eq'],
    TenantLocaleInterface::ATTR_IS_FALLBACK  => ['$eq'],
    TenantLocaleInterface::ATTR_IS_ACTIVE    => ['$eq'],
])]
final class EloquentTenantLocaleRepository extends Repository implements TenantLocaleRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, TenantLocale> $rows */
        $rows = $this->query()
            ->where(TenantLocaleInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(TenantLocaleInterface::ATTR_IS_DEFAULT)
            ->orderByDesc(TenantLocaleInterface::ATTR_IS_FALLBACK)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findDefaultForTenant(string $tenantId): ?TenantLocale
    {
        /** @var TenantLocale|null $row */
        $row = $this->query()
            ->where(TenantLocaleInterface::ATTR_TENANT_ID, $tenantId)
            ->where(TenantLocaleInterface::ATTR_IS_DEFAULT, true)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findFallbackForTenant(string $tenantId): ?TenantLocale
    {
        /** @var TenantLocale|null $row */
        $row = $this->query()
            ->where(TenantLocaleInterface::ATTR_TENANT_ID, $tenantId)
            ->where(TenantLocaleInterface::ATTR_IS_FALLBACK, true)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByComposite(string $tenantId, string $languageId): ?TenantLocale
    {
        /** @var TenantLocale|null $row */
        $row = $this->query()
            ->where(TenantLocaleInterface::ATTR_TENANT_ID, $tenantId)
            ->where(TenantLocaleInterface::ATTR_LANGUAGE_ID, $languageId)
            ->first();

        return $row;
    }
}
