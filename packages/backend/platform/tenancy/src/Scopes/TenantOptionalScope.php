<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Facade;

/**
 * Global scope applied by {@see \Academorix\Tenancy\Concerns\BelongsToTenantOptional}.
 *
 * Filters to `WHERE tenant_id = ? OR tenant_id IS NULL` — platform-
 * wide catalogue rows (nullable `tenant_id`) are visible to every
 * tenant alongside the tenant's own rows.
 *
 * When no tenant context is bound, the scope is a no-op.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantOptionalScope implements Scope
{
    /**
     * Apply the scope.
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

        $qualified = $model->qualifyColumn($column);

        $builder->where(function (Builder $q) use ($qualified, $tenantId): void {
            $q->where($qualified, $tenantId)->orWhereNull($qualified);
        });
    }

    /**
     * Resolve the active tenant id from the container-bound context.
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
