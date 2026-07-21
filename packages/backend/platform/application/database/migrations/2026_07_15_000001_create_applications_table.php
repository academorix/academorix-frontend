<?php

declare(strict_types=1);

use Stackra\Application\Contracts\Data\ApplicationInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `applications` table.
 *
 * Global cross-tenant product registry. Applications rarely change
 * (~1-8 rows lifetime); this table is central-connection only, never
 * tenant-scoped. Partial unique index on `is_default = TRUE` ensures
 * exactly one default row per deployment.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(ApplicationInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `app_<26 chars>`.
            $table->string(ApplicationInterface::ATTR_ID, 64)->primary();

            // URL-safe identifier — appears in prose + cross-service tokens.
            $table->string(ApplicationInterface::ATTR_SLUG, 63);

            // Display + description.
            $table->string(ApplicationInterface::ATTR_NAME, 200);
            $table->text(ApplicationInterface::ATTR_DESCRIPTION)->nullable();

            // Optional preselected BusinessType for the self-serve picker.
            // References BusinessTypeEnum case values (string, not FK — enums are code-primary).
            $table->string(ApplicationInterface::ATTR_DEFAULT_BUSINESS_TYPE, 32)->nullable();

            // Locale + timezone + currency defaults.
            $table->string(ApplicationInterface::ATTR_DEFAULT_LOCALE, 10)->default('en');
            $table->string(ApplicationInterface::ATTR_DEFAULT_TIMEZONE, 64)->default('UTC');
            $table->string(ApplicationInterface::ATTR_DEFAULT_CURRENCY, 3)->default('USD');

            // Host resolution — `platform.domain` middleware reads these.
            $table->string(ApplicationInterface::ATTR_CENTRAL_HOST, 200);
            $table->string(ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST, 200);

            // Application-scoped config bag (branding tokens, feature-flag
            // overrides, deployment metadata). Confidential tier.
            $table->jsonb(ApplicationInterface::ATTR_CONFIG)->nullable();

            // Free-form platform notes — never queried.
            $table->jsonb(ApplicationInterface::ATTR_METADATA)->nullable();

            // Lifecycle flags.
            $table->boolean(ApplicationInterface::ATTR_IS_DEFAULT)->default(false);
            $table->boolean(ApplicationInterface::ATTR_IS_SYSTEM)->default(false);

            // Userstamps (from mattiverse/userstamps).
            $table->uuid(ApplicationInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(ApplicationInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(ApplicationInterface::ATTR_DELETED_BY)->nullable();

            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // URL-facing lookups.
            $table->unique(
                [ApplicationInterface::ATTR_SLUG],
                'applications_slug_unique',
            );
            $table->unique(
                [ApplicationInterface::ATTR_CENTRAL_HOST],
                'applications_central_host_unique',
            );
            $table->unique(
                [ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST],
                'applications_platform_admin_host_unique',
            );

            // Partial unique — exactly one default row per deployment.
            // Postgres partial index; MySQL falls back to a regular unique
            // (still enforces the invariant via the seeder's guard).
            $table->index(
                [ApplicationInterface::ATTR_IS_DEFAULT],
                'applications_is_default_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ApplicationInterface::TABLE);
    }
};
