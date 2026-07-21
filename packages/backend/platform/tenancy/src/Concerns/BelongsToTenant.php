<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Concerns;

use Stackra\Tenancy\Exceptions\CrossTenantWriteException;
use Stackra\Tenancy\Models\Tenant;
use Stackra\Tenancy\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Facade;

/**
 * Applied to every row scoped to a Tenant (below the tenancy
 * boundary). The primary substrate every downstream module composes.
 *
 * Adds:
 *   - `tenant_id` column contract (composing model's Interface must
 *     declare `ATTR_TENANT_ID`).
 *   - Auto-fill on `saving` from the request-resolved Tenant context.
 *   - Cross-tenant write refusal — a save that carries a
 *     `tenant_id` different from the resolved tenant throws
 *     {@see CrossTenantWriteException} (400, `alert` severity).
 *   - `tenant()` BelongsTo relation.
 *   - Global read scope via {@see TenantScope} — filters every read
 *     to the active tenant. Bypass with
 *     `Model::withoutGlobalScope(TenantScope::class)` — permitted
 *     only in platform-admin contexts.
 *
 * ## Composition order
 *
 * Compose `BelongsToTenant` FIRST in the model's `use` list — before
 * any trait whose boot hook depends on the tenant scope
 * (`BelongsToBranch`, `BelongsToOrganization`, …). Traits boot in
 * declaration order.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
trait BelongsToTenant
{
    /**
     * Boot the trait — hook the `saving` event to auto-fill
     * `tenant_id` on new rows AND to refuse cross-tenant writes.
     */
    public static function bootBelongsToTenant(): void
    {
        static::saving(function ($model): void {
            $column        = self::tenantForeignKey();
            $resolvedId    = self::resolveTenantIdForFill();
            $currentValue  = $model->{$column} ?? null;

            // Row already carries an explicit tenant_id — validate it
            // against the resolved tenant. Cross-tenant writes are a
            // hard failure (this is the "always a bug OR an attack"
            // path — pages on-call per errors.json).
            if (! empty($currentValue) && $resolvedId !== null && $currentValue !== $resolvedId) {
                throw CrossTenantWriteException::forMismatch(
                    expected: $resolvedId,
                    actual: (string) $currentValue,
                    model: $model::class,
                );
            }

            // No tenant_id set — auto-fill from the resolved context
            // when we have one. Seeders / factories / console commands
            // without a bound context must pass tenant_id explicitly.
            if (empty($currentValue) && $resolvedId !== null) {
                $model->{$column} = $resolvedId;
            }
        });

        // Register the global read scope. `withoutGlobalScope()` in
        // platform-admin contexts is the sanctioned bypass.
        static::addGlobalScope(new TenantScope());
    }

    /**
     * The BelongsTo relation — `$row->tenant`.
     *
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, self::tenantForeignKey());
    }

    /**
     * Foreign-key column name. Defaults to `tenant_id`. Override on
     * the composing model when the schema uses a different column.
     */
    public static function tenantForeignKey(): string
    {
        return 'tenant_id';
    }

    /**
     * Resolve the current tenant id for the auto-fill hook.
     *
     * Reads from the container-bound `tenant.context` binding
     * (populated by the `resolve.tenant` middleware). Returns `null`
     * when no context is bound — typical in seeders, factories, and
     * console commands. Callers in those contexts must pass
     * `tenant_id` explicitly.
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
