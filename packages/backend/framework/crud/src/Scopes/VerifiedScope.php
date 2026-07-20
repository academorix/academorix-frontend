<?php

declare(strict_types=1);

/**
 * Verified Scope
 *
 * Support class providing Verified Scope utilities for the Framework module.
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
 * Verified Scope.
 *
 * Filters only verified records by checking that the verified-at
 * column is not null.
 *
 * @since 2.0.0
 */
#[AsScope(name: 'verified', description: 'Filter only verified records', tags: ['status', 'common'])]
class VerifiedScope implements Scope
{
    /**
     * Create a new VerifiedScope instance.
     *
     * @param  string  $column  The verified-at column (default: 'verified_at').
     */
    public function __construct(
        protected string $column = 'verified_at',
    ) {}

    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  Builder  $builder  The query builder instance.
     * @param  Model  $model  The model instance.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $builder->whereNotNull($this->column);
    }
}
