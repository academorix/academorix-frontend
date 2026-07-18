<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Facade;

/**
 * Global scope applied by {@see \Academorix\Tenancy\Concerns\BelongsToTenant}.
 *
 * Filters every read to `WHERE tenant_id = ?` for the tenant
 * resolved by the `resolve.tenant` middleware. Bypass with
 * `Model::withoutGlobalScope(TenantScope::class)` — sanctioned only
 * in platform-admin contexts + retention jobs that iterate every
 * tenant.
 *
 * When no tenant context is bound (seeders, console commands,
 * pre-middleware code paths), the scope is a no-op — the caller
 * sees every row. Callers in those contexts must scope their own
 * queries or accept full-table reads.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantScope implements Scope
{
    /**
     * Apply the scope to the given Eloquent query builder.
     *
     * @param  Builder<Model>  $builder
     */
    public function apply(Builder $builder, Model $model): void
    {
        $tenantId = self::resolveTenantId();
        if ($tenantId === null) {
            return;
        }

        $column = \method_exists($model, 'tenantForeignKey')
            ? $model::tenantForeignKey()
            : 'tenant_id';

        $builder->where($model->qualifyColumn($column), $tenantId);
    }

    /**
     * Resolve the active tenant id from the container-bound context.
     * Returns `null` when no context is bound.
     */
    private static function resolveTenantId(): ?string
    {
        try {
            $app = Facade::getFacadeApplication();
        } catch (\Throwable) {
            return null;
        }

        if ($app === null || ! $app->bound('tenant.context')) {
            return null;
        }

        $context = $app->make('tenant.context');
        $id      = \method_exists($context, 'currentId') ? $context->currentId() : null;

        return \is_string($id) && $id !== '' ? $id : null;
    }
}
