<?php

declare(strict_types=1);

namespace Stackra\Gateway\Services;

use Stackra\Gateway\Contracts\Services\CheckoutComGatewayDriverInterface;
use Stackra\Gateway\Data\PaymentIntentRequest;
use Stackra\Gateway\Data\PaymentIntentResponse;
use Stackra\Gateway\Data\RefundRequest;
use Stackra\Gateway\Data\RefundResponse;
use Stackra\Gateway\Data\WebhookEnvelope;
use Stackra\Gateway\Exceptions\PaymentGatewayException;
use Stackra\Gateway\Exceptions\WebhookSignatureInvalidException;
use Illuminate\Container\Attributes\Scoped;

/**
 * Checkout.com driver — adapter over the `checkout/checkout-sdk-php` SDK.
 *
 * Checkout.com's model is close to Stripe (payment tokens + refunds +
 * webhooks) but the SDK method names diverge. Downstream consumers use
 * this driver via the generic `PaymentGatewayInterface`.
 *
 * ## TODO — wire the Checkout.com SDK
 *
 * 1. Add `checkout/checkout-sdk-php` to composer.
 * 2. Doppler `CHECKOUT_COM_SECRET_KEY` -> `config('gateway.checkout_com.secret')`.
 * 3. Environment routing (sandbox vs production) per PaymentGatewayConfig.mode.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Scoped]
final class CheckoutComGatewayDriver implements CheckoutComGatewayDriverInterface
{
    public function provider(): string
    {
        return 'checkout_com';
    }

    public function createIntent(PaymentIntentRequest $request): PaymentIntentResponse
    {
        // TODO(gateway): Payments::request($paymentRequest).
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::createIntent not yet wired.',
        );
    }

    public function confirmIntent(string $providerIntentId, ?string $paymentMethodId = null): PaymentIntentResponse
    {
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::confirmIntent — most flows confirm client-side.',
        );
    }

    public function captureIntent(string $providerIntentId, ?int $amountMinor = null): PaymentIntentResponse
    {
        // TODO(gateway): Payments::capture($paymentId, $captureRequest).
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::captureIntent not yet wired.',
        );
    }

    public function cancelIntent(string $providerIntentId, string $reason = 'requested_by_customer'): PaymentIntentResponse
    {
        // TODO(gateway): Payments::void($paymentId, $voidRequest).
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::cancelIntent not yet wired.',
        );
    }

    public function retrieveIntent(string $providerIntentId): PaymentIntentResponse
    {
        // TODO(gateway): Payments::get($paymentId).
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::retrieveIntent not yet wired.',
        );
    }

    public function refund(RefundRequest $request): RefundResponse
    {
        // TODO(gateway): Payments::refund($paymentId, $refundRequest).
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::refund not yet wired.',
        );
    }

    public function verifyWebhookSignature(string $payload, string $signature, string $secret): void
    {
        // TODO(gateway): Checkout.com uses HMAC-SHA256 over the raw body with
        // the webhook signing key from the dashboard.
        throw new WebhookSignatureInvalidException(
            'CheckoutComGatewayDriver::verifyWebhookSignature not yet wired.',
        );
    }

    public function parseWebhook(string $payload): WebhookEnvelope
    {
        // TODO(gateway): map `type` in the payload (`payment_captured`,
        // `payment_refunded`, `dispute_evidence_required`) to the platform's
        // canonical event names.
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::parseWebhook not yet wired.',
        );
    }

    public function ensureCustomer(
        string $tenantId,
        string $localCustomerId,
        string $email,
        ?string $name = null,
        array $metadata = [],
    ): string {
        // TODO(gateway): Customers::create($request) OR retrieve by
        // metadata.local_id.
        throw new PaymentGatewayException(
            'CheckoutComGatewayDriver::ensureCustomer not yet wired.',
        );
    }
}
