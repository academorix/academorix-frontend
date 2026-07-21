<?php

/**
 * @file src/Eloquent/ScopedGlobalScope.php
 *
 * @description
 * Global scope that, when applied to a model carrying
 * {@see \Stackra\Scope\Attributes\ScopedTo}, appends a
 * `WHERE scope_node_id IN (<ancestor chain>)` clause to every
 * query. The clause uses the active {@see ScopeContextData}'s
 * `ancestorIds()`, so a query executed at a deep leaf sees rows
 * stored anywhere along the ancestor path.
 */

declare(strict_types=1);

namespace Stackra\Scope\Scopes;

use Stackra\Scope\Contracts\ScopeContextInterface;
use Stackra\Scope\Models\ScopeValue;
use Illuminate\Container\Attributes\Config;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Global scope — attach to a model via
 * `Model::addGlobalScope(new ScopedGlobalScope(...))`, wired by
 * the service provider for every `#[ScopedTo]` class it can
 * discover.
 *
 * ## Column convention
 *
 * The scope assumes the target model's table has a column named
 * `scope_node_id`. Deployments that use a different column name
 * for legacy reasons can publish the scope config and override
 * `scope.eloquent.column` (not implemented in this initial pass
 * — a follow-up).
 */
/**
 * Applies the ancestor-chain filter to any Eloquent model. The
 * `Scope` interface is generic on the target model type but this
 * filter is column-based (it looks for a `scope_node_id` column
 * regardless of which model owns it), so we bind the template to
 * the base Eloquent Model.
 *
 * @template-implements Scope<Model>
 */
final class ScopedGlobalScope implements Scope
{
    /**
     * @param  ScopeContextInterface  $context  Injected —
     *                                          request-scoped current context (nullable when the
     *                                          request predates the `scope` middleware).
     * @param  bool  $autoScopeEnabled  Feature
     *                                  flag pulled from `config('scope.eloquent.auto_scope_enabled')`
     *                                  via the `#[Config]` container attribute (ADR 0006 —
     *                                  preferred over injecting the whole ConfigRepository).
     */
    public function __construct(
        private readonly ScopeContextInterface $context,
        #[Config('scope.eloquent.auto_scope_enabled', true)]
        private readonly bool $autoScopeEnabled = true,
    ) {}

    /**
     * Apply the scope filter to a query builder.
     *
     * When auto-scoping is disabled globally (via
     * `scope.eloquent.auto_scope_enabled = false`) or there's no
     * active context, the filter is a no-op — the model behaves
     * as if the scope wasn't attached. Callers who want strict
     * enforcement wrap their routes in the `scope` middleware,
     * which fails closed on missing context.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if ($this->autoScopeEnabled === false) {
            return;
        }

        $ctx = $this->context->get();
        if ($ctx === null) {
            return;
        }

        $ancestors = $ctx->ancestorIds();
        if ($ancestors === []) {
            return;
        }

        // The `scope_node_id` column is a convention; the alias
        // matches the `ScopeValue` model's column so the whole
        // package stays self-consistent.
        $builder->whereIn(
            $model->qualifyColumn(ScopeValue::ATTR_SCOPE_NODE_ID),
            $ancestors,
        );
    }
}
