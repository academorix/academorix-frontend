<?php

declare(strict_types=1);

use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `webhook_subscriptions` table.
 *
 * Customer-registered webhook targets. Composite scanning indexes on
 * `(tenant_id, status)` for the dispatch hot path and on `status` for
 * cross-tenant admin views.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(WebhookSubscriptionInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `whs_<26 chars>`.
            $table->string(WebhookSubscriptionInterface::ATTR_ID, 64)->primary();

            $table->string(WebhookSubscriptionInterface::ATTR_TENANT_ID, 64);
            $table->foreign(WebhookSubscriptionInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(WebhookSubscriptionInterface::ATTR_NAME, 200);

            // Destination driver + config.
            $table->string(WebhookSubscriptionInterface::ATTR_DESTINATION, 32)->default('https');
            $table->text(WebhookSubscriptionInterface::ATTR_DESTINATION_CONFIG);
            $table->jsonb(WebhookSubscriptionInterface::ATTR_EVENTS)->default('[]');

            // Signing secrets (encrypted at the model layer).
            $table->text(WebhookSubscriptionInterface::ATTR_SIGNING_SECRET);
            $table->text(WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS)->nullable();
            $table->timestampTz(WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_ROTATED_AT)->nullable();

            // Optional pin to a specific ApiVersion.
            $table->string(WebhookSubscriptionInterface::ATTR_API_VERSION, 32)->nullable();

            // Lifecycle state.
            $table->string(WebhookSubscriptionInterface::ATTR_STATUS, 16)->default('active');
            $table->unsignedInteger(WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES)->default(0);
            $table->timestampTz(WebhookSubscriptionInterface::ATTR_DISABLED_AT)->nullable();
            $table->string(WebhookSubscriptionInterface::ATTR_DISABLED_REASON, 32)->nullable();

            // Rate limit + backoff.
            $table->unsignedInteger(WebhookSubscriptionInterface::ATTR_RATE_LIMIT_PER_MINUTE)->default(60);
            $table->string(WebhookSubscriptionInterface::ATTR_BACKOFF_STRATEGY, 32)->default('static');
            $table->jsonb(WebhookSubscriptionInterface::ATTR_BACKOFF_CONFIG)->nullable();

            // Timestamps of the last delivery + health probe outcome.
            $table->timestampTz(WebhookSubscriptionInterface::ATTR_LAST_DELIVERY_AT)->nullable();
            $table->string(WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_URL, 2048)->nullable();
            $table->timestampTz(WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT)->nullable();
            $table->string(WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_STATUS, 16)->default('unknown');

            $table->jsonb(WebhookSubscriptionInterface::ATTR_METADATA)->nullable();

            $table->uuid(WebhookSubscriptionInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(WebhookSubscriptionInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(WebhookSubscriptionInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Dispatch hot path — resolve active subscriptions per tenant.
            $table->index(
                [WebhookSubscriptionInterface::ATTR_TENANT_ID, WebhookSubscriptionInterface::ATTR_STATUS],
                'webhook_subscriptions_tenant_status_index',
            );

            // Cross-tenant admin views filter by status.
            $table->index(
                WebhookSubscriptionInterface::ATTR_STATUS,
                'webhook_subscriptions_status_index',
            );

            // Health-probe scheduler scans by last-probe timestamp.
            $table->index(
                WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT,
                'webhook_subscriptions_health_probe_last_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(WebhookSubscriptionInterface::TABLE);
    }
};
