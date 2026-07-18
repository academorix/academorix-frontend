<?php

/**
 * @file modules/notifications/notifications-mail/database/migrations/2026_07_15_000120_create_mail_suppressions_table.php
 *
 * @description
 * Create the `mail_suppressions` table.
 *
 * Persisted block-list of email addresses that must NOT be sent to.
 * `tenant_id NULL` = platform-wide row (spam-trap, known invalid
 * addresses) applied to every tenant's outbound mail. `tenant_id`
 * set = tenant-scoped row only applied to that tenant.
 *
 * Composite indexes:
 *
 *   * `(tenant_id, email)` UNIQUE — at most one active row per
 *     `(tenant_id, email)` pair. `tenant_id NULL` uniquely matches
 *     the platform-wide row for the address.
 *   * `(tenant_id, email_domain, reason)` — admin filter by
 *     domain + reason.
 *   * `(reason, expires_at)` — pruner scan for expired soft-bounce
 *     rows.
 */

declare(strict_types=1);

use Academorix\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `mail_suppressions` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(MailSuppressionInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `msp_<26 chars>`.
            $table->string(MailSuppressionInterface::ATTR_ID, 64)->primary();

            // Nullable — tenant_id NULL means platform-wide row.
            $table->string(MailSuppressionInterface::ATTR_TENANT_ID, 64)->nullable();

            // Normalised (lowercased) email address.
            $table->string(MailSuppressionInterface::ATTR_EMAIL, 254);
            // Denormalised domain for admin filter + platform-wide
            // domain blocks (spam-trap domains).
            $table->string(MailSuppressionInterface::ATTR_EMAIL_DOMAIN, 253);

            // See MailSuppressionReason enum for allowed values.
            $table->string(MailSuppressionInterface::ATTR_REASON, 32);

            // Which provider reported this suppression (nullable —
            // manual rows have no provider).
            $table->string(MailSuppressionInterface::ATTR_PROVIDER, 32)->nullable();

            // Delivery id that produced the bounce / complaint —
            // null for manual + spam-trap rows.
            $table->string(MailSuppressionInterface::ATTR_SOURCE_DELIVERY_ID, 64)->nullable();

            // Sanitised bounce reason from the provider payload.
            $table->text(MailSuppressionInterface::ATTR_BOUNCE_REASON)->nullable();

            // Platform-wide protection rows. Immutable outside seeder.
            $table->boolean(MailSuppressionInterface::ATTR_IS_SYSTEM)->default(false);

            // Provider-specific bounce metadata + provider event ids
            // for correlation.
            $table->jsonb(MailSuppressionInterface::ATTR_METADATA)->nullable();

            // Soft-bounce entries auto-expire at this time. NULL for
            // hard bounces / complaints / manual / spam-trap
            // (permanent).
            $table->timestampTz(MailSuppressionInterface::ATTR_EXPIRES_AT)->nullable();

            $table->uuid(MailSuppressionInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(MailSuppressionInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(MailSuppressionInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Uniqueness — at most one active suppression per
            // (tenant, email). Composite handles both tenant-scoped
            // and platform-wide (tenant_id NULL) rows.
            $table->unique(
                [
                    MailSuppressionInterface::ATTR_TENANT_ID,
                    MailSuppressionInterface::ATTR_EMAIL,
                ],
                'mail_suppressions_tenant_email_uq',
            );

            // Admin filter: view suppressions by domain + reason.
            $table->index(
                [
                    MailSuppressionInterface::ATTR_TENANT_ID,
                    MailSuppressionInterface::ATTR_EMAIL_DOMAIN,
                    MailSuppressionInterface::ATTR_REASON,
                ],
                'mail_suppressions_tenant_domain_reason_idx',
            );

            // Pruner scan: soft-bounce expiries.
            $table->index(
                [
                    MailSuppressionInterface::ATTR_REASON,
                    MailSuppressionInterface::ATTR_EXPIRES_AT,
                ],
                'mail_suppressions_reason_expiry_idx',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(MailSuppressionInterface::TABLE);
    }
};
