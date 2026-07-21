<?php

declare(strict_types=1);

use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `webhook_deliveries` table.
 *
 * Append-only per-attempt audit trail. Cascading FK to
 * `webhook_subscriptions`. Scanning indexes on `(tenant_id,
 * subscription_id, dispatched_at)` and `(status, retry_at)` power the
 * dashboard read path and the retry scheduler respectively.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(WebhookDeliveryInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `whd_<26 chars>`.
            $table->string(WebhookDeliveryInterface::ATTR_ID, 64)->primary();

            $table->string(WebhookDeliveryInterface::ATTR_TENANT_ID, 64);
            $table->foreign(WebhookDeliveryInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID, 64);
            $table->foreign(WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID)
                ->references(WebhookSubscriptionInterface::ATTR_ID)
                ->on(WebhookSubscriptionInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(WebhookDeliveryInterface::ATTR_EVENT_NAME, 128);
            $table->string(WebhookDeliveryInterface::ATTR_EVENT_ID, 64)->nullable();
            $table->string(WebhookDeliveryInterface::ATTR_API_VERSION, 32)->nullable();

            // Encrypted payload snapshot + hash for dedup / audit.
            $table->text(WebhookDeliveryInterface::ATTR_PAYLOAD);
            $table->string(WebhookDeliveryInterface::ATTR_PAYLOAD_HASH, 64);

            // Attempt bookkeeping + status.
            $table->unsignedSmallInteger(WebhookDeliveryInterface::ATTR_ATTEMPT)->default(1);
            $table->string(WebhookDeliveryInterface::ATTR_STATUS, 24)->default('pending');
            $table->unsignedSmallInteger(WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE)->nullable();
            $table->jsonb(WebhookDeliveryInterface::ATTR_RESPONSE_HEADERS)->nullable();

            // Response body truncated to ~4KB at the sender.
            $table->text(WebhookDeliveryInterface::ATTR_RESPONSE_BODY)->nullable();
            $table->unsignedInteger(WebhookDeliveryInterface::ATTR_LATENCY_MS)->nullable();

            $table->timestampTz(WebhookDeliveryInterface::ATTR_DISPATCHED_AT)->nullable();
            $table->timestampTz(WebhookDeliveryInterface::ATTR_DELIVERED_AT)->nullable();
            $table->timestampTz(WebhookDeliveryInterface::ATTR_FAILED_AT)->nullable();
            $table->timestampTz(WebhookDeliveryInterface::ATTR_RETRY_AT)->nullable();

            $table->text(WebhookDeliveryInterface::ATTR_ERROR_MESSAGE)->nullable();
            $table->jsonb(WebhookDeliveryInterface::ATTR_METADATA)->nullable();

            $table->uuid(WebhookDeliveryInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(WebhookDeliveryInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Dashboard hot path — deliveries for a tenant/subscription over time.
            $table->index(
                [
                    WebhookDeliveryInterface::ATTR_TENANT_ID,
                    WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID,
                    WebhookDeliveryInterface::ATTR_DISPATCHED_AT,
                ],
                'webhook_deliveries_tenant_subscription_dispatched_index',
            );

            // Retry scheduler scan.
            $table->index(
                [WebhookDeliveryInterface::ATTR_STATUS, WebhookDeliveryInterface::ATTR_RETRY_AT],
                'webhook_deliveries_status_retry_index',
            );

            // Receiver-side idempotency by source event id.
            $table->index(
                WebhookDeliveryInterface::ATTR_EVENT_ID,
                'webhook_deliveries_event_id_index',
            );

            // Event-name analytics.
            $table->index(
                WebhookDeliveryInterface::ATTR_EVENT_NAME,
                'webhook_deliveries_event_name_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(WebhookDeliveryInterface::TABLE);
    }
};
