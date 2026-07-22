<?php

/**
 * @file packages/backend/workflow/approvals/database/migrations/2026_07_22_000000_drop_application_id_from_approval_templates_table.php
 *
 * @description
 * Drop `application_id` from the `approval_templates` table per ADR-0031 §D3.
 *
 * The `approval_templates` row cascades through its legitimate parent — no attribution
 * is lost by removing the direct `application_id` column. Every downstream
 * consumer that used to read `$row->application_id` reads through the
 * parent relationship instead.
 *
 * This migration ALSO rewrites the composite unique index(es) that referenced application_id — per ADR-0031 §D3. The DB refuses to drop a column referenced by an index, so the sequence is: drop old index → drop column → recreate narrower index.
 *
 * ## Related
 *
 *   * ADR-0031 §D3 — the mandate this migration executes.
 *   * `.kiro/steering/tenancy-columns.md §2` — the 12-row named list that
 *     excludes this row.
 *   * `.kiro/steering/tenancy-columns.md §9b` — the closed-rows register
 *     the auditor reads.
 */

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Stackra\Approvals\Contracts\Data\ApprovalTemplateInterface;
use Illuminate\Support\Facades\DB;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        // Step 1: drop the wide partial-unique indexes that reference application_id.
        //         Both indexes are Postgres partial-unique indexes (WHERE deleted_at IS NULL
        //         and WHERE is_active = true), which Blueprint's ->unique() can't express.
        //         Match the base migration's raw-SQL shape.
        DB::statement('DROP INDEX IF EXISTS approval_templates_composite_unique');
        DB::statement('DROP INDEX IF EXISTS approval_templates_one_active_unique');

        // Step 2: drop the column itself.
        Schema::table(ApprovalTemplateInterface::TABLE, function (Blueprint $table): void {
            $table->dropColumn(ApprovalTemplateInterface::ATTR_APPLICATION_ID);
        });

        // Step 3: recreate the partial-unique indexes WITHOUT application_id.
        //         Natural key becomes (tenant_id, action_key, name, version) — Application
        //         cascades through tenants.application_id so it drops out of the natural key
        //         without losing uniqueness.
        DB::statement('CREATE UNIQUE INDEX approval_templates_composite_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ', ' . ApprovalTemplateInterface::ATTR_VERSION . ') WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX approval_templates_one_active_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ') WHERE deleted_at IS NULL AND is_active = true');
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        // Step 1: drop the narrower indexes we created in up().
        DB::statement('DROP INDEX IF EXISTS approval_templates_composite_unique');
        DB::statement('DROP INDEX IF EXISTS approval_templates_one_active_unique');

        // Step 2: add application_id back.
        Schema::table(ApprovalTemplateInterface::TABLE, function (Blueprint $table): void {
            $table->uuid(ApprovalTemplateInterface::ATTR_APPLICATION_ID)->nullable();
        });

        // Step 3: recreate the WIDER partial-unique indexes.
        DB::statement('CREATE UNIQUE INDEX approval_templates_composite_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_APPLICATION_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ', ' . ApprovalTemplateInterface::ATTR_VERSION . ') WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX approval_templates_one_active_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_APPLICATION_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ') WHERE deleted_at IS NULL AND is_active = true');
    }
};
