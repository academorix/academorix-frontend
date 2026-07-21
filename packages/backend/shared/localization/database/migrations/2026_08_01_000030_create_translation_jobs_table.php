<?php

/**
 * @file modules/shared/localization/database/migrations/2026_08_01_000030_create_translation_jobs_table.php
 *
 * @description
 * Create the `translation_jobs` table — audit trail for async bulk
 * translation work. Created BEFORE the translations table so the
 * FK from translations.translation_job_id resolves.
 */

declare(strict_types=1);

use Stackra\Localization\Contracts\Data\TranslationJobInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `translation_jobs` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        $table = (string) \config(
            'localization.tables.translation_jobs',
            TranslationJobInterface::TABLE,
        );

        Schema::create($table, function (Blueprint $blueprint): void {
            $blueprint->string(TranslationJobInterface::ATTR_ID, 64)->primary();

            $blueprint->string(TranslationJobInterface::ATTR_TENANT_ID, 64)->index();

            // Nullable — command-line dispatches (cron, admin CLI) run
            // outside a user context.
            $blueprint->string(TranslationJobInterface::ATTR_INITIATOR_ID, 64)->nullable();

            $blueprint->string(TranslationJobInterface::ATTR_KIND, 32);
            $blueprint->string(TranslationJobInterface::ATTR_DRIVER, 32);
            $blueprint->string(TranslationJobInterface::ATTR_DRIVER_MODEL, 64)->nullable();

            $blueprint->string(TranslationJobInterface::ATTR_SOURCE_LOCALE, 32);
            $blueprint->string(TranslationJobInterface::ATTR_TARGET_LOCALE, 32);

            $blueprint->string(TranslationJobInterface::ATTR_STATUS, 32)->default('queued');

            $blueprint->unsignedInteger(TranslationJobInterface::ATTR_TOTAL_KEYS)->default(0);
            $blueprint->unsignedInteger(TranslationJobInterface::ATTR_TRANSLATED_KEYS)->default(0);
            $blueprint->unsignedInteger(TranslationJobInterface::ATTR_FAILED_KEYS)->default(0);

            $blueprint->string(TranslationJobInterface::ATTR_NAMESPACE_FILTER, 64)->nullable();
            $blueprint->string(TranslationJobInterface::ATTR_GROUP_FILTER, 64)->nullable();

            $blueprint->timestamp(TranslationJobInterface::ATTR_STARTED_AT)->nullable();
            $blueprint->timestamp(TranslationJobInterface::ATTR_FINISHED_AT)->nullable();
            $blueprint->text(TranslationJobInterface::ATTR_ERROR_MESSAGE)->nullable();
            $blueprint->json(TranslationJobInterface::ATTR_METADATA)->nullable();

            $blueprint->string(TranslationJobInterface::ATTR_CREATED_BY, 64)->nullable();
            $blueprint->string(TranslationJobInterface::ATTR_UPDATED_BY, 64)->nullable();
            $blueprint->timestamps();

            $blueprint->index(
                [TranslationJobInterface::ATTR_TENANT_ID, TranslationJobInterface::ATTR_STATUS],
                'tjobs_tenant_status_idx',
            );

            $blueprint->index(
                [TranslationJobInterface::ATTR_TENANT_ID, TranslationJobInterface::ATTR_CREATED_AT],
                'tjobs_tenant_time_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        $table = (string) \config(
            'localization.tables.translation_jobs',
            TranslationJobInterface::TABLE,
        );

        Schema::dropIfExists($table);
    }
};
