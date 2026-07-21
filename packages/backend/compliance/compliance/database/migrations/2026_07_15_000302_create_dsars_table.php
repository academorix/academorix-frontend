<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000302_create_dsars_table.php
 *
 * @description
 * Create the `dsars` table.
 *
 * Data-subject-request state machine.
 */

declare(strict_types=1);

use Stackra\Compliance\Contracts\Data\DsarInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(DsarInterface::TABLE, function (Blueprint $table): void {
            $table->string(DsarInterface::ATTR_ID, 64)->primary();

            $table->string(DsarInterface::ATTR_TENANT_ID, 64);
            $table->string(DsarInterface::ATTR_SUBJECT_TYPE, 191);
            $table->string(DsarInterface::ATTR_SUBJECT_ID, 64);

            $table->string(DsarInterface::ATTR_ACTION, 24);
            $table->string(DsarInterface::ATTR_STATE, 24)->default('received');
            $table->string(DsarInterface::ATTR_ASSIGNED_REVIEWER_ID, 64)->nullable();

            $table->timestampTz(DsarInterface::ATTR_REQUESTED_AT);
            $table->timestampTz(DsarInterface::ATTR_VERIFIED_AT)->nullable();
            $table->timestampTz(DsarInterface::ATTR_DELIVERED_AT)->nullable();
            $table->timestampTz(DsarInterface::ATTR_REJECTED_AT)->nullable();
            $table->text(DsarInterface::ATTR_REJECTION_REASON)->nullable();

            $table->integer(DsarInterface::ATTR_SLA_DAYS)->default(30);
            $table->integer(DsarInterface::ATTR_ARTEFACT_COUNT)->default(0);
            $table->string(DsarInterface::ATTR_DOWNLOAD_SIGNATURE, 128)->nullable();
            $table->timestampTz(DsarInterface::ATTR_DOWNLOAD_EXPIRES_AT)->nullable();

            $table->text(DsarInterface::ATTR_NOTES)->nullable();
            $table->jsonb(DsarInterface::ATTR_METADATA)->nullable();

            $table->uuid(DsarInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(DsarInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(DsarInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(
                [DsarInterface::ATTR_TENANT_ID, DsarInterface::ATTR_STATE],
                'dsars_tenant_state_index',
            );

            $table->index(
                [DsarInterface::ATTR_SUBJECT_TYPE, DsarInterface::ATTR_SUBJECT_ID],
                'dsars_subject_index',
            );

            $table->index(
                [DsarInterface::ATTR_DOWNLOAD_SIGNATURE],
                'dsars_download_signature_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(DsarInterface::TABLE);
    }
};
