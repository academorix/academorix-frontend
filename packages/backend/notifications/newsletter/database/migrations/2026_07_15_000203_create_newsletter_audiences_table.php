<?php

/**
 * @file modules/notifications/newsletter/database/migrations/2026_07_15_000203_create_newsletter_audiences_table.php
 *
 * @description
 * Create the `newsletter_audiences` table.
 *
 * Audience segment definitions per newsletter. `expression` is the
 * rule-based JSON DSL; `cached_subscriber_ids` holds the pre-
 * evaluated list produced by the audience builder job. Every
 * newsletter has exactly one `is_default = true` audience seeded on
 * creation.
 */

declare(strict_types=1);

use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `newsletter_audiences` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(NewsletterAudienceInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `nla_<26 chars>`.
            $table->string(NewsletterAudienceInterface::ATTR_ID, 64)->primary();

            $table->string(NewsletterAudienceInterface::ATTR_TENANT_ID, 64);
            $table->string(NewsletterAudienceInterface::ATTR_NEWSLETTER_ID, 64);
            $table->foreign(NewsletterAudienceInterface::ATTR_NEWSLETTER_ID)
                ->references(NewsletterInterface::ATTR_ID)
                ->on(NewsletterInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(NewsletterAudienceInterface::ATTR_SLUG, 191);
            $table->string(NewsletterAudienceInterface::ATTR_NAME, 200);
            $table->text(NewsletterAudienceInterface::ATTR_DESCRIPTION)->nullable();

            $table->jsonb(NewsletterAudienceInterface::ATTR_EXPRESSION)->nullable();
            $table->boolean(NewsletterAudienceInterface::ATTR_IS_DEFAULT)->default(false);

            $table->jsonb(NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS)->nullable();
            $table->unsignedInteger(NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_COUNT)->default(0);
            $table->timestampTz(NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT)->nullable();

            $table->jsonb(NewsletterAudienceInterface::ATTR_METADATA)->nullable();

            $table->uuid(NewsletterAudienceInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NewsletterAudienceInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NewsletterAudienceInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Slug is unique within a newsletter.
            $table->unique(
                [
                    NewsletterAudienceInterface::ATTR_NEWSLETTER_ID,
                    NewsletterAudienceInterface::ATTR_SLUG,
                ],
                'newsletter_audiences_newsletter_slug_uq',
            );

            // Audience refresh command scans by cache age.
            $table->index(
                NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT,
                'newsletter_audiences_cache_refreshed_at_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(NewsletterAudienceInterface::TABLE);
    }
};
