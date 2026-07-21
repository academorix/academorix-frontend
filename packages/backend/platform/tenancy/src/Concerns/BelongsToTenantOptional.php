<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Concerns;

use Stackra\Tenancy\Models\Tenant;
use Stackra\Tenancy\Scopes\TenantOptionalScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Facade;

/**
 * Sibling of {@see BelongsToTenant} for rows whose `tenant_id` may
 * legitimately be `NULL` — platform-wide catalogue rows + system-
 * level audit / suppression rows.
 *
 * Adds:
 *   - Nullable `tenant_id` column contract.
 *   - Auto-fill on `saving` from the resolved Tenant context (when
 *     one is bound). No cross-tenant refusal — this trait exists
 *     precisely so `NULL` is a valid state.
 *   - `tenant()` BelongsTo relation.
 *   - Global read scope via {@see TenantOptionalScope} —
 *     `WHERE tenant_id = ? OR tenant_id IS NULL`. Platform-wide rows
 *     are visible to every tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
trait BelongsToTenantOptional
{
    /**
     * Boot the trait — hook the `saving` event to auto-fill
     * `tenant_id` when a tenant is resolved AND the caller left it
     * blank. Leaves it `NULL` when no context is bound.
     */
    public static function bootBelongsToTenantOptional(): void
    {
        static::saving(function ($model): void {
            $column       = self::tenantForeignKey();
            $currentValue = $model->{$column} ?? null;

            // Caller passed an explicit `null` OR a concrete tenant
            // id — leave both alone.
            if ($currentValue !== null || \array_key_exists($column, $model->getAttributes())) {
                return;
            }

            $resolvedId = self::resolveTenantIdForFill();
            if ($resolvedId !== null) {
                $model->{$column} = $resolvedId;
            }
        });

        static::addGlobalScope(new TenantOptionalScope());
    }

    /**
     * The BelongsTo relation — nullable.
     *
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, self::tenantForeignKey());
    }

    /**
     * Foreign-key column name.
     */
    public static function tenantForeignKey(): string
    {
        return 'tenant_id';
    }

    /**
     * Resolve the current tenant id for the auto-fill hook. Same
     * container-bound `tenant.context` lookup as
     * {@see BelongsToTenant::resolveTenantIdForFill()}.
     */
    protected static function resolveTenantIdForFill(): ?string
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
