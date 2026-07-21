<?php

declare(strict_types=1);

namespace Stackra\Gateway\Data;

/**
 * Provider-agnostic response DTO from creating a payment intent.
 *
 * Carries the provider-side intent id + a `client_secret` (for
 * client-side confirmation via the provider's JS SDK) + the current
 * intent status.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
final readonly class PaymentIntentResponse
{
    /**
     * @param  string                $provider           Provider slug (`stripe`, `paddle`, ...).
     * @param  string                $providerIntentId   Provider-side intent id (Stripe `pi_*`).
     * @param  string                $clientSecret       Client-side confirmation token.
     * @param  string                $status             `requires_payment_method` / `requires_confirmation` /
     *                                                    `requires_action` / `processing` / `succeeded` / `canceled`.
     * @param  int                   $amountMinor        Confirmed amount in minor units.
     * @param  string                $currency           ISO-4217.
     * @param  string|null           $nextActionUrl      3-D-Secure redirect / off-session confirmation URL.
     * @param  string|null           $providerCustomerId Provider-side customer id (fresh if it didn't exist).
     * @param  array<string, mixed>  $raw                Full provider payload for downstream audit.
     */
    public function __construct(
        public string $provider,
        public string $providerIntentId,
        public string $clientSecret,
        public string $status,
        public int $amountMinor,
        public string $currency,
        public ?string $nextActionUrl = null,
        public ?string $providerCustomerId = null,
        public array $raw = [],
    ) {
    }
}
