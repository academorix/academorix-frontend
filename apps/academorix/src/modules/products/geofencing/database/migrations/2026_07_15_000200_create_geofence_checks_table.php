<?php

declare(strict_types=1);

use Stackra\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `geofence_checks` table.
 *
 * Immutable audit log — insert-only from application code (the model's
 * `saving` hook throws on any update). Overrides are new rows with
 * `supersedes_check_id` pointing at the original.
 *
 * `captured_location` is intentionally a plain string column here — on
 * production Postgres, the consumer app's own migration promotes the column
 * to `GEOGRAPHY(POINT, 4326)` via `clickbar/laravel-magellan` once the
 * PostGIS extension is enabled. SQLite / non-Postgres drivers tolerate the
 * string form for the module's boot / test path.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(GeofenceCheckInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `gfc_<26 chars>`.
            $table->string(GeofenceCheckInterface::ATTR_ID, 64)->primary();

            $table->string(GeofenceCheckInterface::ATTR_TENANT_ID, 64);
            $table->foreign(GeofenceCheckInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Polymorphic pointer #1 — WHAT the check ran against.
            $table->string(GeofenceCheckInterface::ATTR_FENCEABLE_TYPE, 64);
            $table->string(GeofenceCheckInterface::ATTR_FENCEABLE_ID, 64);

            // Polymorphic pointer #2 — WHY the check ran.
            $table->string(GeofenceCheckInterface::ATTR_SUBJECT_TYPE, 64);
            $table->string(GeofenceCheckInterface::ATTR_SUBJECT_ID, 64);

            // Evaluation output.
            $table->string(GeofenceCheckInterface::ATTR_RESULT, 16);
            $table->string(GeofenceCheckInterface::ATTR_MODE, 16);

            // Captured location — string form for portability. Consumer
            // apps override to GEOGRAPHY(POINT, 4326) via Magellan on
            // Postgres. Length 128 accommodates WKT `POINT(lng lat)` +
            // parenthesised POINTZ / POINTM shapes.
            $table->string(GeofenceCheckInterface::ATTR_CAPTURED_LOCATION, 128)->nullable();

            $table->unsignedInteger(GeofenceCheckInterface::ATTR_ACCURACY_M)->nullable();
            $table->double(GeofenceCheckInterface::ATTR_DISTANCE_TO_FENCE_M)->nullable();

            $table->timestampTz(GeofenceCheckInterface::ATTR_EVALUATED_AT);

            // Override chain — self-referencing FK.
            $table->string(GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID, 64)->nullable();
            $table->foreign(GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID)
                ->references(GeofenceCheckInterface::ATTR_ID)
                ->on(GeofenceCheckInterface::TABLE)
                ->restrictOnDelete();

            $table->string(GeofenceCheckInterface::ATTR_OVERRIDE_TASK_ID, 64)->nullable();
            $table->uuid(GeofenceCheckInterface::ATTR_OVERRIDDEN_BY_USER_ID)->nullable();
            $table->text(GeofenceCheckInterface::ATTR_OVERRIDE_REASON)->nullable();

            $table->jsonb(GeofenceCheckInterface::ATTR_METADATA)->nullable();

            $table->uuid(GeofenceCheckInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(GeofenceCheckInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(GeofenceCheckInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Fenceable audit history — "every check against this venue".
            $table->index(
                [
                    GeofenceCheckInterface::ATTR_FENCEABLE_TYPE,
                    GeofenceCheckInterface::ATTR_FENCEABLE_ID,
                    GeofenceCheckInterface::ATTR_EVALUATED_AT,
                ],
                'geofence_checks_fenceable_evaluated_at_index',
            );

            // Subject audit history — "every check tied to this clock-in".
            $table->index(
                [
                    GeofenceCheckInterface::ATTR_SUBJECT_TYPE,
                    GeofenceCheckInterface::ATTR_SUBJECT_ID,
                    GeofenceCheckInterface::ATTR_EVALUATED_AT,
                ],
                'geofence_checks_subject_evaluated_at_index',
            );

            // Tenant feed pagination.
            $table->index(
                [GeofenceCheckInterface::ATTR_TENANT_ID, GeofenceCheckInterface::ATTR_EVALUATED_AT],
                'geofence_checks_tenant_evaluated_at_index',
            );

            // Result-filtered admin views.
            $table->index(
                [GeofenceCheckInterface::ATTR_TENANT_ID, GeofenceCheckInterface::ATTR_RESULT],
                'geofence_checks_tenant_result_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(GeofenceCheckInterface::TABLE);
    }
};
