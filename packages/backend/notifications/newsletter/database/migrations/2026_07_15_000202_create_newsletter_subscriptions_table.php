<?php

/**
 * @file modules/notifications/newsletter/database/migrations/2026_07_15_000202_create_newsletter_subscriptions_table.php
 *
 * @description
 * Create the `newsletter_subscriptions` table.
 *
 * One row per (newsletter, email). Carries CAN-SPAM + CASL consent
 * evidence + engagement metrics + signed tokens for the confirm /
 * unsubscribe flows. Email is unique per newsletter.
 */

declare(strict_types=1);

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `newsletter_subscriptions` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(NewsletterSubscriptionInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `nls_<26 chars>`.
            $table->string(NewsletterSubscriptionInterface::ATTR_ID, 64)->primary();

            $table->string(NewsletterSubscriptionInterface::ATTR_TENANT_ID, 64);
            $table->string(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, 64);
            $table->foreign(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID)
                ->references(NewsletterInterface::ATTR_ID)
                ->on(NewsletterInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Optional link to a user (subscribers may be anonymous
            // — a name + email is enough for CAN-SPAM compliance).
            $table->uuid(NewsletterSubscriptionInterface::ATTR_USER_ID)->nullable();

            $table->string(NewsletterSubscriptionInterface::ATTR_EMAIL, 320);
            $table->string(NewsletterSubscriptionInterface::ATTR_FIRST_NAME, 120)->nullable();
            $table->string(NewsletterSubscriptionInterface::ATTR_LAST_NAME, 120)->nullable();
            $table->string(NewsletterSubscriptionInterface::ATTR_LOCALE, 12)->nullable();

            $table->string(NewsletterSubscriptionInterface::ATTR_STATUS, 32)->default('pending_confirmation');
            $table->string(NewsletterSubscriptionInterface::ATTR_SOURCE, 64)->default('public');

            $table->jsonb(NewsletterSubscriptionInterface::ATTR_TAGS)->nullable();

            // Signed HMAC tokens (Base64URL-encoded). Confirmation
            // token is single-use; unsubscribe token is perpetual.
            $table->string(NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN, 128)->nullable();
            $table->string(NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN, 128)->nullable();
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT)->nullable();

            // Lifecycle timestamps.
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT)->nullable();
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT)->nullable();
            $table->string(NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON, 64)->nullable();
            $table->string(NewsletterSubscriptionInterface::ATTR_BOUNCE_KIND, 16)->nullable();
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_BOUNCED_AT)->nullable();
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_COMPLAINED_AT)->nullable();

            // Consent evidence: form_url + consent_text_hash +
            // captured checkbox label. Regulatory PII.
            $table->jsonb(NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE)->nullable();

            // IP truncated to /24 by the observer (GDPR minimisation).
            $table->string(NewsletterSubscriptionInterface::ATTR_IP_ADDRESS, 45)->nullable();
            $table->string(NewsletterSubscriptionInterface::ATTR_USER_AGENT, 500)->nullable();

            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT)->nullable();

            // Engagement — updated by the engagement tracker job.
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_LAST_OPENED_AT)->nullable();
            $table->timestampTz(NewsletterSubscriptionInterface::ATTR_LAST_CLICKED_AT)->nullable();
            $table->unsignedTinyInteger(NewsletterSubscriptionInterface::ATTR_ENGAGEMENT_SCORE)->default(0);

            $table->jsonb(NewsletterSubscriptionInterface::ATTR_METADATA)->nullable();

            $table->uuid(NewsletterSubscriptionInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NewsletterSubscriptionInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NewsletterSubscriptionInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Dedup — one row per (newsletter, email).
            $table->unique(
                [
                    NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID,
                    NewsletterSubscriptionInterface::ATTR_EMAIL,
                ],
                'newsletter_subscriptions_newsletter_email_uq',
            );

            // Token lookups on the public subscribe / unsubscribe
            // path.
            $table->index(
                NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN,
                'newsletter_subscriptions_confirmation_token_idx',
            );
            $table->index(
                NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN,
                'newsletter_subscriptions_unsubscribe_token_idx',
            );

            // Admin listing + audience evaluation.
            $table->index(
                [
                    NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID,
                    NewsletterSubscriptionInterface::ATTR_STATUS,
                ],
                'newsletter_subscriptions_newsletter_status_idx',
            );

            // Prune command finds expired pending-confirmation rows.
            $table->index(
                [
                    NewsletterSubscriptionInterface::ATTR_STATUS,
                    NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT,
                ],
                'newsletter_subscriptions_status_expires_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(NewsletterSubscriptionInterface::TABLE);
    }
};
