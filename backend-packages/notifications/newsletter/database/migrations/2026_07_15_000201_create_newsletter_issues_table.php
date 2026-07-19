<?php

/**
 * @file modules/notifications/newsletter/database/migrations/2026_07_15_000201_create_newsletter_issues_table.php
 *
 * @description
 * Create the `newsletter_issues` table.
 *
 * One editorial issue per row. `content_blocks` + `variables`
 * carry the render payload; `scheduled_at` / `sent_at` /
 * `cancelled_at` carry the state-transition timeline.
 */

declare(strict_types=1);

use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `newsletter_issues` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(NewsletterIssueInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `nli_<26 chars>`.
            $table->string(NewsletterIssueInterface::ATTR_ID, 64)->primary();

            $table->string(NewsletterIssueInterface::ATTR_TENANT_ID, 64);
            $table->string(NewsletterIssueInterface::ATTR_NEWSLETTER_ID, 64);
            $table->foreign(NewsletterIssueInterface::ATTR_NEWSLETTER_ID)
                ->references(NewsletterInterface::ATTR_ID)
                ->on(NewsletterInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(NewsletterIssueInterface::ATTR_SLUG, 191)->nullable();
            $table->unsignedInteger(NewsletterIssueInterface::ATTR_ISSUE_NUMBER)->nullable();

            $table->string(NewsletterIssueInterface::ATTR_SUBJECT, 500);
            $table->string(NewsletterIssueInterface::ATTR_PREHEADER, 500)->nullable();

            $table->jsonb(NewsletterIssueInterface::ATTR_CONTENT_BLOCKS)->nullable();
            $table->jsonb(NewsletterIssueInterface::ATTR_VARIABLES)->nullable();

            $table->string(NewsletterIssueInterface::ATTR_STATUS, 32)->default('draft');

            $table->timestampTz(NewsletterIssueInterface::ATTR_SCHEDULED_AT)->nullable();
            $table->timestampTz(NewsletterIssueInterface::ATTR_SENT_AT)->nullable();
            $table->timestampTz(NewsletterIssueInterface::ATTR_CANCELLED_AT)->nullable();
            $table->string(NewsletterIssueInterface::ATTR_CANCEL_REASON, 500)->nullable();

            $table->jsonb(NewsletterIssueInterface::ATTR_METADATA)->nullable();

            $table->uuid(NewsletterIssueInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NewsletterIssueInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NewsletterIssueInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Issue number is unique within a newsletter (per non-manual
            // cadence). Partial unique enforced at the app-layer.
            $table->index(
                [
                    NewsletterIssueInterface::ATTR_NEWSLETTER_ID,
                    NewsletterIssueInterface::ATTR_ISSUE_NUMBER,
                ],
                'newsletter_issues_newsletter_number_idx',
            );

            // Send-scheduled command scans for due issues.
            $table->index(
                [
                    NewsletterIssueInterface::ATTR_STATUS,
                    NewsletterIssueInterface::ATTR_SCHEDULED_AT,
                ],
                'newsletter_issues_status_scheduled_at_idx',
            );

            // Admin list — issues within a newsletter.
            $table->index(
                [
                    NewsletterIssueInterface::ATTR_NEWSLETTER_ID,
                    NewsletterIssueInterface::ATTR_CREATED_AT,
                ],
                'newsletter_issues_newsletter_created_at_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(NewsletterIssueInterface::TABLE);
    }
};
