<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000307_create_safeguarding_incidents_table.php
 *
 * @description
 * Create the `safeguarding_incidents` table.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\SafeguardingIncidentInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SafeguardingIncidentInterface::TABLE, function (Blueprint $table): void {
            $table->string(SafeguardingIncidentInterface::ATTR_ID, 64)->primary();

            $table->string(SafeguardingIncidentInterface::ATTR_TENANT_ID, 64);
            $table->string(SafeguardingIncidentInterface::ATTR_SUBJECT_TYPE, 191);
            $table->string(SafeguardingIncidentInterface::ATTR_SUBJECT_ID, 64);

            $table->string(SafeguardingIncidentInterface::ATTR_SEVERITY, 16);
            $table->string(SafeguardingIncidentInterface::ATTR_STATE, 24)->default('reported');
            $table->string(SafeguardingIncidentInterface::ATTR_TITLE, 200);
            $table->text(SafeguardingIncidentInterface::ATTR_DESCRIPTION);
            $table->jsonb(SafeguardingIncidentInterface::ATTR_KEYWORDS)->nullable();

            $table->string(SafeguardingIncidentInterface::ATTR_REPORTED_BY_USER_ID, 64)->nullable();
            $table->string(SafeguardingIncidentInterface::ATTR_ASSIGNED_TO_USER_ID, 64)->nullable();
            $table->timestampTz(SafeguardingIncidentInterface::ATTR_REPORTED_AT);
            $table->timestampTz(SafeguardingIncidentInterface::ATTR_ESCALATED_AT)->nullable();
            $table->timestampTz(SafeguardingIncidentInterface::ATTR_RESOLVED_AT)->nullable();
            $table->timestampTz(SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT)->nullable();

            $table->boolean(SafeguardingIncidentInterface::ATTR_PENDING_EXTERNAL_REFERRAL)->default(false);
            $table->string(SafeguardingIncidentInterface::ATTR_EXTERNAL_REFERRAL_REFERENCE, 128)->nullable();

            $table->jsonb(SafeguardingIncidentInterface::ATTR_METADATA)->nullable();

            $table->uuid(SafeguardingIncidentInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SafeguardingIncidentInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SafeguardingIncidentInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(
                [SafeguardingIncidentInterface::ATTR_TENANT_ID, SafeguardingIncidentInterface::ATTR_STATE],
                'safeguarding_incidents_tenant_state_index',
            );

            $table->index(
                [SafeguardingIncidentInterface::ATTR_SEVERITY, SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT],
                'safeguarding_incidents_escalation_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SafeguardingIncidentInterface::TABLE);
    }
};
