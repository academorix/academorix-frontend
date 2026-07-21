<?php

declare(strict_types=1);

namespace Stackra\Application\Database\Macros;

use Stackra\Database\Attributes\AsDatabaseBlueprint;
use Illuminate\Database\Schema\Blueprint;

/**
 * Migration-schema macro paired with the {@see \Stackra\Application\Concerns\BelongsToApplication}
 * trait. Adds `application_id` + FK + composite index to a table in one
 * call:
 *
 * ```php
 * Schema::create('roles', function (Blueprint $t) {
 *     $t->string('id', 64)->primary();
 *     $t->applicable();  // ← adds application_id + FK + index
 *     $t->string('name');
 *     $t->timestampsTz();
 * });
 * ```
 *
 * Auto-discovered at boot by
 * {@see \Stackra\Database\Providers\DatabaseServiceProvider} —
 * `#[AsDatabaseBlueprint]` marks this class for the discovery loop,
 * which calls {@see self::register()} sorted by attribute `priority`.
 * `priority: 25` places this AFTER the core generic macros
 * (`uuidable`/`userStampable`/... at 20) and BEFORE consumer-app
 * overrides (0-9). Consumer modules must NOT redefine the macro —
 * one canonical implementation, one registrar.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsDatabaseBlueprint(
    description: 'Adds applicable() macro — application_id FK + index paired with BelongsToApplication.',
    priority: 25,
)]
final class ApplicableMacro
{
    /**
     * Register the `applicable()` macro on `Blueprint`. Idempotent —
     * subsequent calls are no-ops (Laravel's macro registry treats
     * duplicate names as replace).
     */
    public static function register(): void
    {
        Blueprint::macro('applicable', function (bool $nullable = false): void {
            /** @var Blueprint $this */
            $column = $this->string('application_id', 64);
            if ($nullable) {
                $column->nullable();
            }
            $column->index();

            $this->foreign('application_id')
                ->references('id')
                ->on('applications')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }
}
