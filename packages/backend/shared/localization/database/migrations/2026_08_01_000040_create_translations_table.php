<?php

/**
 * @file modules/shared/localization/database/migrations/2026_08_01_000040_create_translations_table.php
 *
 * @description
 * Create the `translations` table — the persistent DB cache the
 * decorated Translator consults before the filesystem. `tenant_id`
 * nullable — null = platform default, non-null = tenant override.
 */

declare(strict_types=1);

use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Contracts\Data\TranslationJobInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `translations` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        $table = (string) \config(
            'localization.tables.translations',
            TranslationInterface::TABLE,
        );

        $platformLanguagesTable = (string) \config(
            'localization.tables.platform_languages',
            PlatformLanguageInterface::TABLE,
        );

        $translationJobsTable = (string) \config(
            'localization.tables.translation_jobs',
            TranslationJobInterface::TABLE,
        );

        Schema::create($table, function (Blueprint $blueprint) use (
            $platformLanguagesTable,
            $translationJobsTable,
        ): void {
            $blueprint->string(TranslationInterface::ATTR_ID, 64)->primary();

            // NULLABLE — null = platform-shipped default, non-null =
            // tenant override.
            $blueprint->string(TranslationInterface::ATTR_TENANT_ID, 64)->nullable();

            $blueprint->string(TranslationInterface::ATTR_LANGUAGE_ID, 64);
            $blueprint->foreign(TranslationInterface::ATTR_LANGUAGE_ID, 'trans_lang_fk')
                ->references(PlatformLanguageInterface::ATTR_ID)
                ->on($platformLanguagesTable)
                ->cascadeOnDelete();

            // Nullable — hand-authored + imported rows have no parent
            // job. AI-produced rows carry the job id.
            $blueprint->string(TranslationInterface::ATTR_TRANSLATION_JOB_ID, 64)->nullable();
            $blueprint->foreign(TranslationInterface::ATTR_TRANSLATION_JOB_ID, 'trans_job_fk')
                ->references(TranslationJobInterface::ATTR_ID)
                ->on($translationJobsTable)
                ->nullOnDelete();

            $blueprint->string(TranslationInterface::ATTR_NAMESPACE, 64)->default(TranslationInterface::NAMESPACE_DEFAULT);
            $blueprint->string(TranslationInterface::ATTR_GROUP, 64);
            $blueprint->string(TranslationInterface::ATTR_KEY, 191);

            // Denormalised BCP-47 locale code, refreshed from
            // PlatformLanguage.bcp47_code by the observer on save.
            // Present so hot-path lookups can avoid the join.
            $blueprint->string(TranslationInterface::ATTR_LOCALE_CODE, 32);

            $blueprint->text(TranslationInterface::ATTR_VALUE);

            $blueprint->string(TranslationInterface::ATTR_SOURCE, 32)->default('manual');
            $blueprint->string(TranslationInterface::ATTR_PROVIDER, 32)->nullable();
            $blueprint->decimal(TranslationInterface::ATTR_QUALITY_SCORE, total: 5, places: 4)->nullable();

            // 64-hex SHA-256 of the source string — used to detect
            // when the source drifts (schema change) and mark the
            // row `is_stale=true`.
            $blueprint->string(TranslationInterface::ATTR_SOURCE_HASH, 64)->nullable();

            $blueprint->boolean(TranslationInterface::ATTR_IS_VERIFIED)->default(false);
            $blueprint->boolean(TranslationInterface::ATTR_IS_STALE)->default(false);
            $blueprint->string(TranslationInterface::ATTR_VERIFIED_BY, 64)->nullable();
            $blueprint->timestamp(TranslationInterface::ATTR_VERIFIED_AT)->nullable();

            $blueprint->string(TranslationInterface::ATTR_CREATED_BY, 64)->nullable();
            $blueprint->string(TranslationInterface::ATTR_UPDATED_BY, 64)->nullable();
            $blueprint->string(TranslationInterface::ATTR_DELETED_BY, 64)->nullable();
            $blueprint->softDeletes();
            $blueprint->timestamps();

            // Primary read-path index — the resolver's hot lookup by
            // (language, namespace, group).
            $blueprint->index(
                [
                    TranslationInterface::ATTR_LANGUAGE_ID,
                    TranslationInterface::ATTR_NAMESPACE,
                    TranslationInterface::ATTR_GROUP,
                ],
                'trans_lang_ns_group_idx',
            );

            // Tenant-scoped read.
            $blueprint->index(
                [
                    TranslationInterface::ATTR_TENANT_ID,
                    TranslationInterface::ATTR_LANGUAGE_ID,
                    TranslationInterface::ATTR_NAMESPACE,
                    TranslationInterface::ATTR_GROUP,
                ],
                'trans_tenant_lang_ns_group_idx',
            );

            // Composite unique per-tenant. Emulated by an index +
            // observer on write since SQLite doesn't support partial
            // indexes reliably across drivers.
            $blueprint->unique(
                [
                    TranslationInterface::ATTR_TENANT_ID,
                    TranslationInterface::ATTR_LANGUAGE_ID,
                    TranslationInterface::ATTR_NAMESPACE,
                    TranslationInterface::ATTR_GROUP,
                    TranslationInterface::ATTR_KEY,
                ],
                'trans_full_key_unique',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        $table = (string) \config(
            'localization.tables.translations',
            TranslationInterface::TABLE,
        );

        Schema::dropIfExists($table);
    }
};
