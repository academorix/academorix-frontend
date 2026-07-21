<?php

declare(strict_types=1);

namespace Stackra\Gateway\Data;

/**
 * Provider-agnostic request DTO for creating a payment intent.
 *
 * Every `PaymentGatewayInterface` driver accepts this shape and returns a
 * `PaymentIntentResponse`. The consumer (finance/payment) never has to know
 * whether the caller ended up on Stripe, Paddle, Checkout.com, etc. — every
 * driver adapts to this contract.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
final readonly class PaymentIntentRequest
{
    /**
     * @param  string                $tenantId          Owning tenant (audit + routing).
     * @param  int                   $amountMinor       Amount in minor units (cents).
     * @param  string                $currency          ISO-4217 currency code.
     * @param  string                $customerId        Local customer id (User/Athlete).
     * @param  string|null           $providerCustomerId Optional pre-existing provider-side customer id.
     * @param  string|null           $paymentMethodId    Optional pre-tokenised payment method (Stripe pm_*).
     * @param  string|null           $description       Order / invoice description.
     * @param  bool                  $capture           `true` for auto-capture (default); `false` to
     *                                                  authorise-and-capture-later (returns a `requires_capture` intent).
     * @param  string|null           $idempotencyKey    Client-supplied idempotency key (falls back to a ULID).
     * @param  string|null           $applicationFeeAccountId  Stripe Connect connected-account id when
     *                                                  the platform takes a `platform_fee_minor` cut.
     * @param  int|null              $platformFeeMinor  Marketplace take-rate in minor units.
     * @param  array<string, mixed>  $metadata          Free-form provider metadata (searchable in the dashboard).
     */
    public function __construct(
        public string $tenantId,
        public int $amountMinor,
        public string $currency,
        public string $customerId,
        public ?string $providerCustomerId = null,
        public ?string $paymentMethodId = null,
        public ?string $description = null,
        public bool $capture = true,
        public ?string $idempotencyKey = null,
        public ?string $applicationFeeAccountId = null,
        public ?int $platformFeeMinor = null,
        public array $metadata = [],
    ) {
    }
}
