<?php

declare(strict_types=1);

namespace Stackra\Gateway\Contracts\Services;

use Stackra\Gateway\Data\WebhookEnvelope;
use Stackra\Gateway\Services\WebhookHandler;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the webhook dispatch handler.
 *
 * The webhook receiver (a public Action carrying `webhook.gateway` middleware)
 * runs three steps in order:
 *
 *   1. Fetch the tenant's active gateway config → resolve the driver.
 *   2. Verify the payload signature via `PaymentGatewayInterface::verifyWebhookSignature()`.
 *   3. Parse via `parseWebhook()` → hand the envelope to `WebhookHandler::handle()`.
 *
 * `handle()` owns:
 *
 *   - Dedup on `(provider, provider_event_id)` — every fire persists a
 *     row in `gateway_webhook_events` with `status = received` before
 *     any downstream work; a duplicate delivery no-ops on the unique index.
 *   - Mapping the normalised `eventType` to a domain event
 *     (`InvoicePaid`, `RefundIssued`, `ChargebackFiled`, `PayoutPaid`, ...)
 *     and dispatching it inside a transaction.
 *   - Updating the row `status` on completion (`processed` / `failed`).
 *
 * Concrete: {@see WebhookHandler}.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Bind(WebhookHandler::class)]
interface WebhookHandlerInterface
{
    /**
     * Handle a webhook envelope end-to-end.
     *
     * @param  WebhookEnvelope  $envelope  Parsed + signature-verified.
     * @param  string           $tenantId  Owning tenant (routed from the webhook's
     *                                     `X-Tenant-Id` header or the provider account).
     */
    public function handle(WebhookEnvelope $envelope, string $tenantId): void;
}
