<?php

/**
 * @file modules/shared/audit/database/migrations/2026_07_15_000100_add_tenant_id_chain_to_audits_table.php
 *
 * @description
 * Add the four Stackra columns on top of owen-it/laravel-auditing's
 * default `audits` table:
 *
 *   - `tenant_id`         — nullable ULID pointing at the owning tenant.
 *     NULL for platform-plane rows. Indexed with `created_at` for the
 *     compliance-scan hot path.
 *   - `chain_hash`        — SHA-512 hex digest (128 chars) of the
 *     canonical serialisation + previous row's `chain_hash`. Populated
 *     by the observer on `creating` when the chain is enabled.
 *   - `chain_verified_at` — timestamp of the last successful chain
 *     walk that visited this row. NULL until the verifier stamps it.
 *   - `metadata`          — free-form JSONB satellite for structured
 *     operator notes (cold-storage keys, retention markers).
 *
 * The vendor's own migration MUST run first (`create_audits_table`
 * ships with `owen-it/laravel-auditing ^13.0` and is auto-registered
 * by the vendor's service provider). This migration is a
 * `Schema::table` overlay.
 */

declare(strict_types=1);

use Stackra\Audit\Contracts\Data\AuditInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Add the four columns + their indexes.
     */
    public function up(): void
    {
        Schema::table(AuditInterface::TABLE, function (Blueprint $table): void {
            $table->string(AuditInterface::ATTR_TENANT_ID, 64)->nullable()->after(AuditInterface::ATTR_ID);

            $table->string(AuditInterface::ATTR_CHAIN_HASH, 128)->nullable();
            $table->timestampTz(AuditInterface::ATTR_CHAIN_VERIFIED_AT)->nullable();
            $table->jsonb(AuditInterface::ATTR_METADATA)->nullable();

            // Indexes ────────────────────────────────────────────────
            // The compliance-scan query is
            //   WHERE tenant_id = ? AND created_at BETWEEN ? AND ?
            // ordered by created_at — a composite index covers both
            // the filter and the sort.
            $table->index(
                [AuditInterface::ATTR_TENANT_ID, AuditInterface::ATTR_CREATED_AT],
                'audits_tenant_created_at_index',
            );

            // Chain-verification hot path — rows pending verification.
            $table->index(
                [AuditInterface::ATTR_CHAIN_VERIFIED_AT],
                'audits_chain_verified_at_index',
            );
        });
    }

    /**
     * Reverse — drop the columns + indexes.
     */
    public function down(): void
    {
        Schema::table(AuditInterface::TABLE, function (Blueprint $table): void {
            $table->dropIndex('audits_tenant_created_at_index');
            $table->dropIndex('audits_chain_verified_at_index');

            $table->dropColumn([
                AuditInterface::ATTR_TENANT_ID,
                AuditInterface::ATTR_CHAIN_HASH,
                AuditInterface::ATTR_CHAIN_VERIFIED_AT,
                AuditInterface::ATTR_METADATA,
            ]);
        });
    }
};
