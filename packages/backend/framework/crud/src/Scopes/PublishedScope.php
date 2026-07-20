<?php

declare(strict_types=1);

/**
 * Published Scope
 *
 * Support class providing Published Scope utilities for the Framework module.
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
 * Published Scope.
 *
 * Filters only published records by checking that the published-at
 * column is less than or equal to the current timestamp.
 *
 * @since 2.0.0
 */
#[AsScope(name: 'published', description: 'Filter only published records', tags: ['status', 'common'])]
class PublishedScope implements Scope
{
    /**
     * Create a new PublishedScope instance.
     *
     * @param  string  $column  The published-at column (default: 'published_at').
     */
    public function __construct(
        protected string $column = 'published_at',
    ) {}

    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  Builder  $builder  The query builder instance.
     * @param  Model  $model  The model instance.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where($this->column, '<=', now());
    }
}
