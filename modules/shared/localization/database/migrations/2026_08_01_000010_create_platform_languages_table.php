<?php

/**
 * @file modules/shared/localization/database/migrations/2026_08_01_000010_create_platform_languages_table.php
 *
 * @description
 * Create the `platform_languages` table — the platform-plane catalogue
 * of BCP-47 locale tags. Deliberately named `platform_languages` to
 * avoid colliding with the vendor-owned `languages` table shipped by
 * `nnjeim/world` (geography module).
 */

declare(strict_types=1);

use Academorix\Geography\Contracts\Data\CountryInterface as GeographyCountryInterface;
use Academorix\Geography\Contracts\Data\LanguageInterface as GeographyLanguageInterface;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `platform_languages` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        $table = (string) \config(
            'localization.tables.platform_languages',
            PlatformLanguageInterface::TABLE,
        );

        Schema::create($table, function (Blueprint $blueprint): void {
            $blueprint->string(PlatformLanguageInterface::ATTR_ID, 64)->primary();

            // BCP-47 tag — e.g. `en`, `fr-CA`, `zh-Hant`. Unique across
            // the whole platform catalogue.
            $blueprint->string(PlatformLanguageInterface::ATTR_BCP47_CODE, 32)->unique();

            // FK to geography — source of truth for ISO-639-1 code +
            // English name + native name + is_rtl / dir. NOT NULL.
            $blueprint->unsignedBigInteger(PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID);
            $blueprint->foreign(PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID, 'plang_geo_lang_fk')
                ->references(GeographyLanguageInterface::ATTR_ID)
                ->on(GeographyLanguageInterface::TABLE)
                ->restrictOnDelete();

            // Optional FK to geography — populated only for regional
            // variants (`fr-CA`, `en-GB`, `pt-BR`). Base languages
            // leave this null.
            $blueprint->unsignedBigInteger(PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID)->nullable();
            $blueprint->foreign(PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID, 'plang_geo_country_fk')
                ->references(GeographyCountryInterface::ATTR_ID)
                ->on(GeographyCountryInterface::TABLE)
                ->restrictOnDelete();

            // ISO-15924 script code (Latn, Arab, Cyrl, Hans, Hant, ...).
            // The one detail genuinely additive over geography — the
            // vendor table doesn't track script.
            $blueprint->string(PlatformLanguageInterface::ATTR_SCRIPT, 8)->nullable();

            // Platform-scoped flags. `is_platform_active` gates the row
            // out of the tenant catalogue without archiving it.
            $blueprint->boolean(PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE)->default(true);
            $blueprint->boolean(PlatformLanguageInterface::ATTR_IS_BETA)->default(false);
            $blueprint->boolean(PlatformLanguageInterface::ATTR_IS_SYSTEM)->default(false);
            $blueprint->integer(PlatformLanguageInterface::ATTR_SORT_ORDER)->default(0);
            $blueprint->text(PlatformLanguageInterface::ATTR_NOTES)->nullable();
            $blueprint->json(PlatformLanguageInterface::ATTR_METADATA)->nullable();

            $blueprint->string(PlatformLanguageInterface::ATTR_CREATED_BY, 64)->nullable();
            $blueprint->string(PlatformLanguageInterface::ATTR_UPDATED_BY, 64)->nullable();
            $blueprint->string(PlatformLanguageInterface::ATTR_DELETED_BY, 64)->nullable();
            $blueprint->softDeletes();
            $blueprint->timestamps();

            // Composite unique — the same (geography_language,
            // geography_country, script) triple cannot appear twice.
            // Guards against a duplicate row for the same effective
            // locale where the human happens to type the BCP-47 tag
            // in a slightly different form.
            $blueprint->unique(
                [
                    PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID,
                    PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID,
                    PlatformLanguageInterface::ATTR_SCRIPT,
                ],
                'plang_geo_script_unique',
            );

            $blueprint->index(
                [PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE, PlatformLanguageInterface::ATTR_SORT_ORDER],
                'plang_active_sort_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        $table = (string) \config(
            'localization.tables.platform_languages',
            PlatformLanguageInterface::TABLE,
        );

        Schema::dropIfExists($table);
    }
};
