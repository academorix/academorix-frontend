<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Tenancy\Contracts\Data\TenantContactInterface;
use Stackra\Tenancy\Contracts\Repositories\TenantContactRepositoryInterface;
use Stackra\Tenancy\Enums\TenantContactKind;
use Stackra\Tenancy\Models\TenantContact;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see TenantContactRepositoryInterface}.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TenantContactInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    TenantContactInterface::ATTR_KIND       => ['$eq', '$in'],
    TenantContactInterface::ATTR_NAME       => ['$contains', '$startsWith'],
    TenantContactInterface::ATTR_EMAIL      => ['$eq', '$contains'],
    TenantContactInterface::ATTR_IS_PRIMARY => ['$eq'],
])]
final class EloquentTenantContactRepository extends Repository implements TenantContactRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findPrimary(string $tenantId, TenantContactKind $kind): ?TenantContact
    {
        /** @var TenantContact|null $contact */
        $contact = $this->query()
            ->where(TenantContactInterface::ATTR_TENANT_ID, $tenantId)
            ->where(TenantContactInterface::ATTR_KIND, $kind->value)
            ->where(TenantContactInterface::ATTR_IS_PRIMARY, true)
            ->first();

        return $contact;
    }

    /**
     * {@inheritDoc}
     */
    public function findByKind(string $tenantId, TenantContactKind $kind): Collection
    {
        /** @var Collection<int, TenantContact> $contacts */
        $contacts = $this->query()
            ->where(TenantContactInterface::ATTR_TENANT_ID, $tenantId)
            ->where(TenantContactInterface::ATTR_KIND, $kind->value)
            ->orderByDesc(TenantContactInterface::ATTR_IS_PRIMARY)
            ->orderBy(TenantContactInterface::ATTR_NAME)
            ->get();

        return $contacts;
    }

    /**
     * {@inheritDoc}
     */
    public function findByEmail(string $tenantId, string $email): Collection
    {
        /** @var Collection<int, TenantContact> $contacts */
        $contacts = $this->query()
            ->where(TenantContactInterface::ATTR_TENANT_ID, $tenantId)
            ->whereRaw('LOWER(email) = ?', [\strtolower(\trim($email))])
            ->get();

        return $contacts;
    }
}
