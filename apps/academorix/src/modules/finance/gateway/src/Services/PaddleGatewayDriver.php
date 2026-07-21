<?php

declare(strict_types=1);

namespace Stackra\Gateway\Services;

use Stackra\Gateway\Contracts\Services\PaddleGatewayDriverInterface;
use Stackra\Gateway\Data\PaymentIntentRequest;
use Stackra\Gateway\Data\PaymentIntentResponse;
use Stackra\Gateway\Data\RefundRequest;
use Stackra\Gateway\Data\RefundResponse;
use Stackra\Gateway\Data\WebhookEnvelope;
use Stackra\Gateway\Exceptions\PaymentGatewayException;
use Stackra\Gateway\Exceptions\WebhookSignatureInvalidException;
use Illuminate\Container\Attributes\Scoped;

/**
 * Paddle driver — thin adapter over Paddle's HTTP API (no first-party PHP SDK
 * at time of writing).
 *
 * Paddle is merchant-of-record — it collects + remits VAT / sales tax on
 * every transaction. That changes two things vs. Stripe:
 *   1. `createIntent()` does NOT correspond to an amount charge; Paddle
 *      transactions are always customer-initiated + tax-inclusive.
 *   2. `retrieveTaxBreakdown()` (added by
 *      {@see PaddleGatewayDriverInterface}) is Paddle-only surface.
 *
 * ## TODO — wire the Paddle SDK
 *
 * 1. Add `paddle/paddle-php-sdk` (or a Guzzle-based HTTP client shim) to
 *    the composer manifest.
 * 2. Doppler `PADDLE_API_KEY` -> `config('gateway.paddle.secret')`.
 * 3. Base URL routing (sandbox vs production) per PaymentGatewayConfig.mode.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Scoped]
final class PaddleGatewayDriver implements PaddleGatewayDriverInterface
{
    public function provider(): string
    {
        return 'paddle';
    }

    public function createIntent(PaymentIntentRequest $request): PaymentIntentResponse
    {
        // TODO(gateway): POST /transactions with items, customer_id, custom_data.metadata.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::createIntent not yet wired.',
        );
    }

    public function confirmIntent(string $providerIntentId, ?string $paymentMethodId = null): PaymentIntentResponse
    {
        // Paddle handles confirmation client-side; the server call is limited
        // to retrieval + status polling.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::confirmIntent — Paddle confirms client-side.',
        );
    }

    public function captureIntent(string $providerIntentId, ?int $amountMinor = null): PaymentIntentResponse
    {
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::captureIntent — Paddle has no auth+capture split.',
        );
    }

    public function cancelIntent(string $providerIntentId, string $reason = 'requested_by_customer'): PaymentIntentResponse
    {
        // TODO(gateway): PATCH /transactions/{id} status=canceled.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::cancelIntent not yet wired.',
        );
    }

    public function retrieveIntent(string $providerIntentId): PaymentIntentResponse
    {
        // TODO(gateway): GET /transactions/{id}.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::retrieveIntent not yet wired.',
        );
    }

    public function refund(RefundRequest $request): RefundResponse
    {
        // TODO(gateway): POST /adjustments with action=refund.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::refund not yet wired.',
        );
    }

    public function verifyWebhookSignature(string $payload, string $signature, string $secret): void
    {
        // TODO(gateway): Paddle uses HMAC-SHA256 over `<timestamp>:<payload>`.
        throw new WebhookSignatureInvalidException(
            'PaddleGatewayDriver::verifyWebhookSignature not yet wired.',
        );
    }

    public function parseWebhook(string $payload): WebhookEnvelope
    {
        // TODO(gateway): normalise Paddle's event_type to the platform's
        // canonical event names.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::parseWebhook not yet wired.',
        );
    }

    public function ensureCustomer(
        string $tenantId,
        string $localCustomerId,
        string $email,
        ?string $name = null,
        array $metadata = [],
    ): string {
        // TODO(gateway): POST /customers or GET by custom_data.local_id.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::ensureCustomer not yet wired.',
        );
    }

    public function retrieveTaxBreakdown(string $providerIntentId): array
    {
        // TODO(gateway): Paddle's transaction response includes `details.totals.tax`
        // + `details.line_items[*].tax` — sum + return.
        throw new PaymentGatewayException(
            'PaddleGatewayDriver::retrieveTaxBreakdown not yet wired.',
        );
    }
}
