<?php

declare(strict_types=1);

namespace Academorix\Application\Contracts\Repositories;

use Academorix\Application\Models\BusinessType;
use Academorix\Application\Repositories\EloquentBusinessTypeRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see BusinessType}.
 *
 * CRUD comes from {@see RepositoryInterface}. Domain methods handle
 * the dual-source lookup pattern — a caller looks up by slug and
 * prefers the tenant override when present, falling back to the
 * platform-seeded row.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): attribute lives on the
 * ABSTRACT (this interface); argument IS the CONCRETE
 * ({@see EloquentBusinessTypeRepository}).
 *
 * @extends RepositoryInterface<BusinessType>
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Bind(EloquentBusinessTypeRepository::class)]
interface BusinessTypeRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve a BusinessType by slug, preferring the tenant override
     * when one exists for the caller's active tenant.
     *
     * @param  string       $slug      BusinessType slug (matches `BusinessTypeEnum` case value for system rows).
     * @param  string|null  $tenantId  Active tenant id. When `null`, only platform-default rows are considered.
     * @return BusinessType|null  Deepest-matching row, or `null` when no row matches.
     */
    public function findBySlug(string $slug, ?string $tenantId = null): ?BusinessType;

    /**
     * Every platform-default row (`tenant_id = null`, `is_system = true`).
     * Ordered by `sort_order`.
     *
     * @return Collection<int, BusinessType>
     */
    public function platformDefaults(): Collection;

    /**
     * Every tenant-defined custom row for a given tenant.
     * Ordered by `sort_order`.
     *
     * @param  string  $tenantId  The tenant.
     * @return Collection<int, BusinessType>
     */
    public function tenantCustoms(string $tenantId): Collection;
}
