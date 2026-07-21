<?php

declare(strict_types=1);

namespace Stackra\Integrations\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Models\TenantIntegration;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see TenantIntegrationRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 300, tags: true)]` — a 5-minute TTL with
 * tag-based invalidation. Shorter than most modules because
 * `last_sync_at` / `next_sync_at` / `sync_cursor` rotate on every
 * SyncIntegrationJob run.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(TenantIntegrationInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    TenantIntegrationInterface::ATTR_TENANT_ID        => ['$eq', '$in'],
    TenantIntegrationInterface::ATTR_KIND             => ['$eq', '$in'],
    TenantIntegrationInterface::ATTR_PROVIDER         => ['$eq', '$in'],
    TenantIntegrationInterface::ATTR_IS_ACTIVE        => ['$eq'],
    TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => ['$eq', '$in'],
])]
final class EloquentTenantIntegrationRepository extends Repository implements TenantIntegrationRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findActiveForTenant(string $tenantId, IntegrationKind $kind): ?TenantIntegration
    {
        /** @var TenantIntegration|null $row */
        $row = $this->query()
            ->where(TenantIntegrationInterface::ATTR_TENANT_ID, $tenantId)
            ->where(TenantIntegrationInterface::ATTR_KIND, $kind->value)
            ->where(TenantIntegrationInterface::ATTR_IS_ACTIVE, true)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findDueForSync(\DateTimeInterface $cutoff): Collection
    {
        /** @var Collection<int, TenantIntegration> $rows */
        $rows = $this->query()
            ->where(TenantIntegrationInterface::ATTR_IS_ACTIVE, true)
            ->whereNotNull(TenantIntegrationInterface::ATTR_NEXT_SYNC_AT)
            ->where(TenantIntegrationInterface::ATTR_NEXT_SYNC_AT, '<=', $cutoff)
            ->orderBy(TenantIntegrationInterface::ATTR_NEXT_SYNC_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, TenantIntegration> $rows */
        $rows = $this->query()
            ->where(TenantIntegrationInterface::ATTR_TENANT_ID, $tenantId)
            ->orderBy(TenantIntegrationInterface::ATTR_KIND)
            ->orderBy(TenantIntegrationInterface::ATTR_NAME)
            ->get();

        return $rows;
    }
}
