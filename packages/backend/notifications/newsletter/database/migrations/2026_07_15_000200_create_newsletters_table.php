<?php

/**
 * @file modules/notifications/newsletter/database/migrations/2026_07_15_000200_create_newsletters_table.php
 *
 * @description
 * Create the `newsletters` table.
 *
 * One publication per row, uniquely identified within a tenant by
 * `slug`. Carries sender identity + branding + reputation thresholds
 * + lifecycle state.
 */

declare(strict_types=1);

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `newsletters` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(NewsletterInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `nlp_<26 chars>`.
            $table->string(NewsletterInterface::ATTR_ID, 64)->primary();

            $table->string(NewsletterInterface::ATTR_TENANT_ID, 64);

            $table->string(NewsletterInterface::ATTR_SLUG, 191);
            $table->string(NewsletterInterface::ATTR_NAME, 200);
            $table->text(NewsletterInterface::ATTR_DESCRIPTION)->nullable();

            // Cadence + status enums stored as short strings so
            // downstream analytics can query without joining an
            // enum lookup table.
            $table->string(NewsletterInterface::ATTR_CADENCE, 32)->default('manual');
            $table->string(NewsletterInterface::ATTR_STATUS, 32)->default('draft');

            $table->boolean(NewsletterInterface::ATTR_CONFIRMATION_REQUIRED)->default(true);

            $table->jsonb(NewsletterInterface::ATTR_SENDER_CONFIG)->nullable();
            $table->jsonb(NewsletterInterface::ATTR_BRAND)->nullable();
            $table->jsonb(NewsletterInterface::ATTR_REPUTATION_THRESHOLDS)->nullable();

            $table->unsignedInteger(NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK)->default(0);
            $table->unsignedInteger(NewsletterInterface::ATTR_LAST_ISSUE_NUMBER)->default(0);

            $table->jsonb(NewsletterInterface::ATTR_METADATA)->nullable();

            $table->uuid(NewsletterInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NewsletterInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NewsletterInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Slug is unique within a tenant.
            $table->unique(
                [
                    NewsletterInterface::ATTR_TENANT_ID,
                    NewsletterInterface::ATTR_SLUG,
                ],
                'newsletters_tenant_slug_uq',
            );

            // Admin listings filter by status.
            $table->index(
                [
                    NewsletterInterface::ATTR_TENANT_ID,
                    NewsletterInterface::ATTR_STATUS,
                ],
                'newsletters_tenant_status_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(NewsletterInterface::TABLE);
    }
};
