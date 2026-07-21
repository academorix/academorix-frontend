<?php

declare(strict_types=1);

namespace Stackra\Gateway\Data;

/**
 * Provider-agnostic request DTO for refunding a payment.
 *
 * Consumed by every `PaymentGatewayInterface::refund()` driver — Stripe,
 * Paddle, Checkout.com all map the intent+amount pair onto their native
 * refund API.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
final readonly class RefundRequest
{
    /**
     * @param  string      $tenantId          Owning tenant.
     * @param  string      $providerIntentId  Provider-side charge / payment intent id.
     * @param  int         $amountMinor       Amount to refund (`0` = full remaining balance).
     * @param  string      $currency          ISO-4217 (must match the intent).
     * @param  string      $reason            `duplicate` / `fraudulent` / `requested_by_customer` / `other`.
     * @param  string|null $idempotencyKey    Client-supplied idempotency key.
     * @param  array<string, mixed> $metadata Free-form provider metadata.
     */
    public function __construct(
        public string $tenantId,
        public string $providerIntentId,
        public int $amountMinor,
        public string $currency,
        public string $reason = 'requested_by_customer',
        public ?string $idempotencyKey = null,
        public array $metadata = [],
    ) {
    }
}
