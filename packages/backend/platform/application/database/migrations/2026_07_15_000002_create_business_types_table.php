<?php

declare(strict_types=1);

use Academorix\Application\Contracts\Data\BusinessTypeInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `business_types` table.
 *
 * Dual-source catalogue — `BusinessTypeEnum` is code-primary; this
 * table is the admin-visible mirror. Rows with `tenant_id = null` are
 * platform-seeded (`is_system = true`, immutable outside the seeder);
 * rows with `tenant_id` set are tenant customs (`is_system = false`).
 *
 * Unique on `(tenant_id, slug)` — a tenant can't have two customs with
 * the same slug, but a platform-default and a tenant-custom can share
 * a slug because `NULL` is a distinct key value in unique indexes.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(BusinessTypeInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `bst_<26 chars>`.
            $table->string(BusinessTypeInterface::ATTR_ID, 64)->primary();

            // Tenant boundary — NULL for platform defaults, set for tenant customs.
            $table->string(BusinessTypeInterface::ATTR_TENANT_ID, 64)->nullable();

            // Enum-backed identifier — matches BusinessTypeEnum case value for
            // system rows; tenant-generated for customs.
            $table->string(BusinessTypeInterface::ATTR_SLUG, 64);

            // Display copy (translatable via spatie/laravel-translatable —
            // stored inline for backwards compat; `translations` JSONB is the
            // canonical per-locale source).
            $table->string(BusinessTypeInterface::ATTR_LABEL, 200);
            $table->text(BusinessTypeInterface::ATTR_DESCRIPTION)->nullable();

            // Visual affordances for the self-serve picker.
            $table->string(BusinessTypeInterface::ATTR_ICON, 100)->nullable();
            $table->string(BusinessTypeInterface::ATTR_HERO_IMAGE_URL, 500)->nullable();

            // Sort ordering + visibility.
            $table->integer(BusinessTypeInterface::ATTR_SORT_ORDER)->default(100);
            $table->boolean(BusinessTypeInterface::ATTR_IS_SYSTEM)->default(false);
            $table->boolean(BusinessTypeInterface::ATTR_IS_VISIBLE)->default(true);

            // Per-locale content translations (`HasTranslations` trait).
            // Shape: `{ "en": { "label": "Academy", "description": "..." }, "ar": {...} }`.
            $table->jsonb(BusinessTypeInterface::ATTR_TRANSLATIONS)->default('{}');

            // Free-form platform notes.
            $table->jsonb(BusinessTypeInterface::ATTR_METADATA)->nullable();

            // Userstamps.
            $table->uuid(BusinessTypeInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(BusinessTypeInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(BusinessTypeInterface::ATTR_DELETED_BY)->nullable();

            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Primary access path — (tenant, slug) tuple. NULL tenant_id
            // is a distinct key so platform defaults coexist with same-slug
            // tenant customs.
            $table->unique(
                [BusinessTypeInterface::ATTR_TENANT_ID, BusinessTypeInterface::ATTR_SLUG],
                'business_types_tenant_slug_unique',
            );

            // Self-serve picker ordering — sort_order across visible rows.
            $table->index(
                [BusinessTypeInterface::ATTR_IS_VISIBLE, BusinessTypeInterface::ATTR_SORT_ORDER],
                'business_types_visible_sort_index',
            );

            // System vs custom split — admin dashboard filter.
            $table->index(
                [BusinessTypeInterface::ATTR_IS_SYSTEM, BusinessTypeInterface::ATTR_SLUG],
                'business_types_is_system_slug_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(BusinessTypeInterface::TABLE);
    }
};
