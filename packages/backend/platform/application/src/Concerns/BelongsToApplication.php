<?php

declare(strict_types=1);

namespace Stackra\Application\Concerns;

use Stackra\Application\Models\Application;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Facade;

/**
 * Applied to rows at the tenancy boundary — Tenant, Role, Permission,
 * TenantSubscription, EntitlementLicense, Audit, Activity (per
 * `.kiro/steering/tenancy-columns.md` §2, the "eight boundary rows"
 * that carry `application_id` directly rather than cascading via
 * `tenant_id`).
 *
 * Adds:
 *   - `application_id` column contract (declared in the composing
 *     model's Interface as `ATTR_APPLICATION_ID`).
 *   - Auto-fill on the `saving` event from the request-resolved
 *     Application. Cross-application writes are refused by the
 *     `ApplicationMismatch` write-path guard in the composing module.
 *   - `application()` BelongsTo relation.
 *
 * Does NOT add a global scope — application resolution is host-based
 * and lives in the `resolve.application` middleware. Adding a global
 * scope here would break every seeder that instantiates rows outside
 * the request lifecycle (no bound Application in that context).
 */
trait BelongsToApplication
{
    /**
     * Boot the trait — hook the `saving` event to auto-fill
     * `application_id` on new rows.
     */
    public static function bootBelongsToApplication(): void
    {
        static::saving(function ($model): void {
            $column = self::applicationForeignKey();

            // Row already carries an application_id — the caller
            // explicitly set it. Refuse cross-app overwrites downstream
            // (write-path guard `ApplicationMismatch`, 422).
            if (! empty($model->{$column})) {
                return;
            }

            $applicationId = self::resolveApplicationIdForFill();
            if ($applicationId !== null) {
                $model->{$column} = $applicationId;
            }
        });
    }

    /**
     * The BelongsTo relation used by callers as `$row->application`.
     *
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class, self::applicationForeignKey());
    }

    /**
     * Foreign-key column name. Defaults to `application_id`. Compose
     * `BelongsToApplication` on a row that uses a different name?
     * Override on the model:
     *
     * ```php
     * public static function applicationForeignKey(): string
     * {
     *     return 'app_id';
     * }
     * ```
     */
    public static function applicationForeignKey(): string
    {
        return 'application_id';
    }

    /**
     * Resolve the current application id for the auto-fill hook.
     *
     * Reads from the container-bound `ApplicationContext` (populated
     * by the `resolve.application` middleware). Returns `null` when
     * no context is bound — typical in seeders, factories, and console
     * commands that instantiate rows outside a request. Callers in
     * those contexts must pass `application_id` explicitly.
     */
    protected static function resolveApplicationIdForFill(): ?string
    {
        // Facade root cheap-check — avoid instantiating a facade
        // during a container-less unit test.
        try {
            $app = Facade::getFacadeApplication();
        } catch (\Throwable) {
            return null;
        }

        if ($app === null || ! $app->bound('application.context')) {
            return null;
        }

        $context = $app->make('application.context');
        $id = \method_exists($context, 'currentId') ? $context->currentId() : null;

        return \is_string($id) && $id !== '' ? $id : null;
    }
}
