<?php

/**
 * @file modules/notifications/newsletter/database/migrations/2026_07_15_000204_create_newsletter_campaigns_table.php
 *
 * @description
 * Create the `newsletter_campaigns` table.
 *
 * One send event per row — pins one issue to one audience at one
 * scheduled time. `counters` is the running JSON aggregate updated
 * atomically by the batch send jobs.
 */

declare(strict_types=1);

use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `newsletter_campaigns` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(NewsletterCampaignInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `nlc_<26 chars>`.
            $table->string(NewsletterCampaignInterface::ATTR_ID, 64)->primary();

            $table->string(NewsletterCampaignInterface::ATTR_TENANT_ID, 64);

            $table->string(NewsletterCampaignInterface::ATTR_NEWSLETTER_ID, 64);
            $table->foreign(NewsletterCampaignInterface::ATTR_NEWSLETTER_ID)
                ->references(NewsletterInterface::ATTR_ID)
                ->on(NewsletterInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(NewsletterCampaignInterface::ATTR_ISSUE_ID, 64);
            $table->foreign(NewsletterCampaignInterface::ATTR_ISSUE_ID)
                ->references(NewsletterIssueInterface::ATTR_ID)
                ->on(NewsletterIssueInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(NewsletterCampaignInterface::ATTR_AUDIENCE_ID, 64);
            $table->foreign(NewsletterCampaignInterface::ATTR_AUDIENCE_ID)
                ->references(NewsletterAudienceInterface::ATTR_ID)
                ->on(NewsletterAudienceInterface::TABLE)
                ->cascadeOnUpdate();

            $table->string(NewsletterCampaignInterface::ATTR_STATUS, 32)->default('pending');

            $table->timestampTz(NewsletterCampaignInterface::ATTR_SCHEDULED_AT);
            $table->timestampTz(NewsletterCampaignInterface::ATTR_STARTED_AT)->nullable();
            $table->timestampTz(NewsletterCampaignInterface::ATTR_COMPLETED_AT)->nullable();
            $table->timestampTz(NewsletterCampaignInterface::ATTR_CANCELLED_AT)->nullable();
            $table->text(NewsletterCampaignInterface::ATTR_FAILURE_REASON)->nullable();

            $table->unsignedInteger(NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE)->default(500);
            $table->unsignedInteger(NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND)->nullable();

            // Running counters — targeted / sent / opened / clicked /
            // bounced / complained / unsubscribed / suppressed /
            // opted_out. Atomically incremented by the batch jobs.
            $table->jsonb(NewsletterCampaignInterface::ATTR_COUNTERS)->nullable();

            $table->jsonb(NewsletterCampaignInterface::ATTR_METADATA)->nullable();

            $table->uuid(NewsletterCampaignInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NewsletterCampaignInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NewsletterCampaignInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Send-scheduled command scans by (status, scheduled_at).
            $table->index(
                [
                    NewsletterCampaignInterface::ATTR_STATUS,
                    NewsletterCampaignInterface::ATTR_SCHEDULED_AT,
                ],
                'newsletter_campaigns_status_scheduled_at_idx',
            );

            // Admin listing per newsletter, newest-first.
            $table->index(
                [
                    NewsletterCampaignInterface::ATTR_NEWSLETTER_ID,
                    NewsletterCampaignInterface::ATTR_CREATED_AT,
                ],
                'newsletter_campaigns_newsletter_created_at_idx',
            );

            // Reputation monitor evaluates completed campaigns in
            // the recent window.
            $table->index(
                [
                    NewsletterCampaignInterface::ATTR_NEWSLETTER_ID,
                    NewsletterCampaignInterface::ATTR_COMPLETED_AT,
                ],
                'newsletter_campaigns_newsletter_completed_at_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(NewsletterCampaignInterface::TABLE);
    }
};
