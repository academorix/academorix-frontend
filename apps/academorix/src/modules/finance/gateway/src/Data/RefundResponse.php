<?php

declare(strict_types=1);

namespace Stackra\Gateway\Data;

/**
 * Provider-agnostic response DTO from a refund call.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
final readonly class RefundResponse
{
    /**
     * @param  string                $provider           Provider slug.
     * @param  string                $providerRefundId   Provider-side refund id (Stripe `re_*`).
     * @param  string                $providerIntentId   Parent intent id.
     * @param  string                $status             `pending` / `succeeded` / `failed` / `canceled`.
     * @param  int                   $amountMinor        Amount refunded in minor units.
     * @param  string                $currency           ISO-4217.
     * @param  \DateTimeImmutable    $createdAt          When the provider recorded the refund.
     * @param  array<string, mixed>  $raw                Full provider payload for downstream audit.
     */
    public function __construct(
        public string $provider,
        public string $providerRefundId,
        public string $providerIntentId,
        public string $status,
        public int $amountMinor,
        public string $currency,
        public \DateTimeImmutable $createdAt,
        public array $raw = [],
    ) {
    }
}
