<?php

declare(strict_types=1);

/**
 * Tenant Scope
 *
 * Support class providing Tenant Scope utilities for the Framework module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Stackra\Crud\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Stackra\Crud\Attributes\AsScope;

/**
 * Tenant Scope.
 *
 * Filters records by tenant ID for multi-tenancy support. Accepts
 * the tenant ID as a constructor parameter — does NOT read from auth().
 * The tenancy package or middleware is responsible for providing the ID.
 *
 * If no tenant ID is provided (null), the scope is a no-op.
 *
 * @since 2.0.0
 */
#[AsScope(name: 'tenant', description: 'Filter records by tenant ID', tags: ['security', 'multi-tenancy'])]
class TenantScope implements Scope
{
    /**
     * Create a new TenantScope instance.
     *
     * @param  mixed|null  $tenantId  The tenant ID to filter by (null = no filter).
     * @param  string  $column  The tenant column (default: 'tenant_id').
     */
    public function __construct(
        protected mixed $tenantId = null,
        protected string $column = 'tenant_id',
    ) {}

    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  Builder  $builder  The query builder instance.
     * @param  Model  $model  The model instance.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if ($this->tenantId !== null) {
            $builder->where($this->column, $this->tenantId);
        }
    }
}
