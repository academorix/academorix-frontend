<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Database\Macros;

use Stackra\Database\Attributes\AsDatabaseBlueprint;
use Illuminate\Database\Schema\Blueprint;

/**
 * Register the `tenantable()` + `tenantableOptional()` macros on
 * {@see Blueprint}.
 *
 * Downstream migrations write:
 *
 * ```php
 * Schema::create('branches', function (Blueprint $t): void {
 *     $t->string('id', 64)->primary();
 *     $t->tenantable();                     // adds tenant_id + FK + index
 *     $t->string('name', 200);
 *     $t->timestamps();
 * });
 * ```
 *
 * `tenantable()` adds the required tenant column + FK + composite
 * index; `tenantableOptional()` adds a nullable one.
 *
 * Discovered at boot by
 * {@see \Stackra\Database\Providers\DatabaseServiceProvider} —
 * `#[AsDatabaseBlueprint(priority: 30)]` places it after the
 * framework core macros (10) + application-tier macros (20).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsDatabaseBlueprint(
    description: 'Adds tenantable() + tenantableOptional() macros to Blueprint. Every downstream module composes tenantable() for tenant-scoped tables.',
    priority: 30,
)]
final class TenantableMacro
{
    /**
     * Register the macros. Called by the database service provider
     * at boot.
     */
    public static function register(): void
    {
        Blueprint::macro('tenantable', function (string $column = 'tenant_id', bool $index = true): void {
            /** @var Blueprint $this */
            $this->string($column, 64)
                ->nullable(false);

            $this->foreign($column)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            if ($index) {
                $this->index([$column, 'created_at']);
            }
        });

        Blueprint::macro('tenantableOptional', function (string $column = 'tenant_id', bool $index = true): void {
            /** @var Blueprint $this */
            $this->string($column, 64)
                ->nullable();

            $this->foreign($column)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            if ($index) {
                $this->index($column);
            }
        });
    }
}
