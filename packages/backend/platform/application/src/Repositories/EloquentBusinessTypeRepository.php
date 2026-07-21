<?php

declare(strict_types=1);

namespace Stackra\Application\Repositories;

use Stackra\Application\Contracts\Data\BusinessTypeInterface;
use Stackra\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Stackra\Application\Models\BusinessType;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see BusinessTypeRepositoryInterface}.
 *
 * ## What this class owns
 *
 * The dual-source pattern's READ path (per
 * `.kiro/steering/enum-db-seed-dual-source.md`) — three domain queries
 * consumed by the tenant-picker widget + tenant-provisioning listener +
 * admin surface:
 *
 *   - {@see findBySlug()}       — prefer-tenant-override lookup. Falls
 *                                  back to the platform-default row
 *                                  when no override exists.
 *   - {@see platformDefaults()} — every `tenant_id IS NULL` +
 *                                  `is_system = true` row, ordered by
 *                                  `sort_order`.
 *   - {@see tenantCustoms()}    — every `tenant_id = ?` +
 *                                  `is_system = false` row for the
 *                                  given tenant.
 *
 * ## Attribute-first wiring
 *
 * `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]` + `#[Filterable]`
 * follow the canonical shape from `.kiro/steering/php-attributes.md`
 * §Stackra CRUD attributes. Every configuration knob a legacy
 * repository would have expressed via `protected` properties or
 * override methods now lives as a class-level attribute pre-resolved
 * at boot (Octane-safe).
 *
 * The container binding to {@see BusinessTypeRepositoryInterface}
 * lives on the interface (`#[Bind(EloquentBusinessTypeRepository::class)]`),
 * following Laravel-canonical placement (`.kiro/steering/php-attributes.md`
 * §Container attributes). This class carries NO `#[Bind]`.
 *
 * ## Cache invalidation semantics
 *
 * `#[Cacheable(tags: true, invalidateOn: ['created', 'updated', 'deleted'])]`
 * — the model-event observer on {@see BusinessType} flushes the
 * tagged cache on write. Reads through this repository land against
 * a 1-hour TTL; writes purge the tag before commit.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(BusinessTypeInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    BusinessTypeInterface::ATTR_TENANT_ID     => ['$eq', '$null'],
    BusinessTypeInterface::ATTR_SLUG          => ['$eq', '$contains', '$startsWith', '$in'],
    BusinessTypeInterface::ATTR_LABEL         => ['$contains', '$startsWith'],
    BusinessTypeInterface::ATTR_IS_SYSTEM     => ['$eq'],
    BusinessTypeInterface::ATTR_IS_VISIBLE    => ['$eq'],
    BusinessTypeInterface::ATTR_SORT_ORDER    => ['$eq', '$gte', '$lte', '$between'],
])]
final class EloquentBusinessTypeRepository extends Repository implements BusinessTypeRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Two-step lookup: prefer the tenant override (`tenant_id = ?`),
     * fall back to the platform default (`tenant_id IS NULL`). Both
     * paths hit the composite unique index `(tenant_id, slug)`.
     * `NULL` counts as a distinct key value in the unique constraint,
     * so a platform-default and a same-slug tenant-custom coexist.
     */
    public function findBySlug(string $slug, ?string $tenantId = null): ?BusinessType
    {
        $slug = \strtolower(\trim($slug));

        if ($tenantId !== null) {
            /** @var BusinessType|null $override */
            $override = $this->query()
                ->where(BusinessTypeInterface::ATTR_TENANT_ID, $tenantId)
                ->where(BusinessTypeInterface::ATTR_SLUG, $slug)
                ->first();

            if ($override !== null) {
                return $override;
            }
        }

        /** @var BusinessType|null $default */
        $default = $this->query()
            ->whereNull(BusinessTypeInterface::ATTR_TENANT_ID)
            ->where(BusinessTypeInterface::ATTR_SLUG, $slug)
            ->first();

        return $default;
    }

    /**
     * {@inheritDoc}
     *
     * @return Collection<int, BusinessType>
     */
    public function platformDefaults(): Collection
    {
        /** @var Collection<int, BusinessType> $rows */
        $rows = $this->query()
            ->whereNull(BusinessTypeInterface::ATTR_TENANT_ID)
            ->where(BusinessTypeInterface::ATTR_IS_SYSTEM, true)
            ->orderBy(BusinessTypeInterface::ATTR_SORT_ORDER)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     *
     * @return Collection<int, BusinessType>
     */
    public function tenantCustoms(string $tenantId): Collection
    {
        /** @var Collection<int, BusinessType> $rows */
        $rows = $this->query()
            ->where(BusinessTypeInterface::ATTR_TENANT_ID, $tenantId)
            ->where(BusinessTypeInterface::ATTR_IS_SYSTEM, false)
            ->orderBy(BusinessTypeInterface::ATTR_SORT_ORDER)
            ->get();

        return $rows;
    }
}
