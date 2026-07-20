<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000301_create_consent_records_table.php
 *
 * @description
 * Create the `consent_records` table.
 *
 * Immutable append-only rows. The composite index
 * `(tenant_id, subject_type, subject_id, category_key, recorded_at)`
 * powers the "latest decision" query.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\ConsentRecordInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(ConsentRecordInterface::TABLE, function (Blueprint $table): void {
            $table->string(ConsentRecordInterface::ATTR_ID, 64)->primary();

            $table->string(ConsentRecordInterface::ATTR_TENANT_ID, 64);
            $table->string(ConsentRecordInterface::ATTR_CONSENT_CATEGORY_ID, 64);
            $table->string(ConsentRecordInterface::ATTR_CATEGORY_KEY, 100);

            $table->string(ConsentRecordInterface::ATTR_SUBJECT_TYPE, 191);
            $table->string(ConsentRecordInterface::ATTR_SUBJECT_ID, 64);

            $table->string(ConsentRecordInterface::ATTR_DECISION, 16);
            $table->string(ConsentRecordInterface::ATTR_GUARDIAN_USER_ID, 64)->nullable();
            $table->string(ConsentRecordInterface::ATTR_VERIFICATION_METHOD, 64)->nullable();
            $table->jsonb(ConsentRecordInterface::ATTR_EVIDENCE)->nullable();

            $table->timestampTz(ConsentRecordInterface::ATTR_RECORDED_AT);
            $table->string(ConsentRecordInterface::ATTR_SOURCE, 32)->nullable();

            $table->jsonb(ConsentRecordInterface::ATTR_METADATA)->nullable();

            $table->uuid(ConsentRecordInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(ConsentRecordInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            $table->index(
                [
                    ConsentRecordInterface::ATTR_TENANT_ID,
                    ConsentRecordInterface::ATTR_SUBJECT_TYPE,
                    ConsentRecordInterface::ATTR_SUBJECT_ID,
                    ConsentRecordInterface::ATTR_CATEGORY_KEY,
                    ConsentRecordInterface::ATTR_RECORDED_AT,
                ],
                'consent_records_subject_category_time_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ConsentRecordInterface::TABLE);
    }
};
