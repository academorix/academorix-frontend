<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000304_create_legal_holds_table.php
 *
 * @description
 * Create the `legal_holds` table.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\LegalHoldInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(LegalHoldInterface::TABLE, function (Blueprint $table): void {
            $table->string(LegalHoldInterface::ATTR_ID, 64)->primary();

            $table->string(LegalHoldInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->string(LegalHoldInterface::ATTR_SCOPE, 16);
            $table->string(LegalHoldInterface::ATTR_SUBJECT_TYPE, 191)->nullable();
            $table->string(LegalHoldInterface::ATTR_SUBJECT_ID, 64)->nullable();
            $table->string(LegalHoldInterface::ATTR_TARGET_CLASS, 191)->nullable();
            $table->string(LegalHoldInterface::ATTR_CASE_REF, 128)->nullable();

            $table->string(LegalHoldInterface::ATTR_APPLIED_BY_USER_ID, 64);
            $table->string(LegalHoldInterface::ATTR_APPROVED_BY_USER_ID, 64);
            $table->text(LegalHoldInterface::ATTR_REASON);

            $table->timestampTz(LegalHoldInterface::ATTR_APPLIED_AT);
            $table->timestampTz(LegalHoldInterface::ATTR_EXPIRES_AT)->nullable();
            $table->timestampTz(LegalHoldInterface::ATTR_RELEASED_AT)->nullable();
            $table->string(LegalHoldInterface::ATTR_RELEASED_BY_USER_ID, 64)->nullable();

            $table->jsonb(LegalHoldInterface::ATTR_METADATA)->nullable();

            $table->uuid(LegalHoldInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(LegalHoldInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(LegalHoldInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(
                [LegalHoldInterface::ATTR_SUBJECT_TYPE, LegalHoldInterface::ATTR_SUBJECT_ID],
                'legal_holds_subject_index',
            );

            $table->index(
                [LegalHoldInterface::ATTR_TENANT_ID, LegalHoldInterface::ATTR_SCOPE],
                'legal_holds_tenant_scope_index',
            );

            $table->index(
                [LegalHoldInterface::ATTR_TARGET_CLASS],
                'legal_holds_target_class_index',
            );

            $table->index(
                [LegalHoldInterface::ATTR_EXPIRES_AT],
                'legal_holds_expiry_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(LegalHoldInterface::TABLE);
    }
};
