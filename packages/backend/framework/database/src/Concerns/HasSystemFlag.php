<?php

declare(strict_types=1);

namespace Academorix\Database\Concerns;

use Academorix\Access\Models\Role;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Database\Eloquent\Builder;

/**
 * Cross-cutting behaviour for models with a platform-owned "system" flag.
 *
 * Some models ship canonical rows the platform seeds and owns (e.g. the four
 * built-in {@see Role}s per tenant, the Starter /
 * Growth / Pro / Enterprise pricing tiers, the reference Sport catalog).
 * Those rows must not be renamed or deleted through the normal API — an
 * admin might remove them by accident and blow up downstream authorization
 * / billing / catalog invariants.
 *
 * Adopters get:
 *
 *  - A boolean `is_system` column exposed via mass-assignment safe casting.
 *  - `scopeSystem()` / `scopeCustom()` for query-side filtering.
 *  - `isSystem()` / `isCustom()` boolean accessors for domain code and
 *    policy checks.
 *  - A `bootHasSystemFlag()` guard that defaults `is_system` to `false`
 *    on `creating` if it wasn't set explicitly — so tenant-authored rows
 *    never accidentally inherit the system flag from an in-memory
 *    factory state.
 *
 * ### Required schema
 *
 * The adopting model's table must have:
 *
 * ```php
 * $table->boolean('is_system')->default(false)->index();
 * ```
 *
 * ### Enforcing "no delete of system rows"
 *
 * The trait deliberately does NOT install a `deleting` hook that throws on
 * a system row — that is a policy concern, not a persistence concern. The
 * matching {@see HandlesAuthorization} policy is
 * expected to return `false` on `update` / `delete` when the target row is
 * a system row (except for platform-admin callers).
 */
trait HasSystemFlag
{
    /**
     * Boot the trait — default `is_system=false` when not set explicitly.
     */
    public static function bootHasSystemFlag(): void
    {
        static::creating(function (self $model): void {
            if ($model->getAttribute('is_system') === null) {
                $model->setAttribute('is_system', false);
            }
        });
    }

    /**
     * Initialise the trait — add `is_system` to the model's cast map.
     *
     * Merges with (rather than overwrites) any existing casts declared by
     * the adopting model. Runs once per instance during Eloquent boot.
     */
    public function initializeHasSystemFlag(): void
    {
        $this->mergeCasts(['is_system' => 'boolean']);
    }

    /**
     * Scope: only rows the platform seeded and owns.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope: only rows created by tenants / operators (not platform-owned).
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeCustom(Builder $query): Builder
    {
        return $query->where('is_system', false);
    }

    /**
     * Whether this row is platform-owned (immutable via the normal API).
     */
    public function isSystem(): bool
    {
        return (bool) $this->getAttribute('is_system');
    }

    /**
     * Whether this row is user / tenant-created (mutable via the normal API).
     */
    public function isCustom(): bool
    {
        return ! $this->isSystem();
    }
}
