<?php

declare(strict_types=1);

/**
 * Exclude Deleted Scope
 *
 * Support class providing Exclude Deleted Scope utilities for the Framework module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Academorix\Crud\Attributes\AsScope;

/**
 * Exclude Deleted Scope.
 *
 * Filters out soft-deleted records by checking that the deleted-at
 * column is null. Useful for models that don't use Laravel's built-in
 * SoftDeletes trait but have a manual deleted_at column.
 *
 * @since 2.0.0
 */
#[AsScope(name: 'exclude-deleted', description: 'Exclude soft-deleted records', tags: ['status', 'common'])]
class ExcludeDeletedScope implements Scope
{
    /**
     * Create a new ExcludeDeletedScope instance.
     *
     * @param  string  $column  The deleted-at column (default: 'deleted_at').
     */
    public function __construct(
        protected string $column = 'deleted_at',
    ) {}

    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  Builder  $builder  The query builder instance.
     * @param  Model  $model  The model instance.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->whereNull($this->column);
    }
}
