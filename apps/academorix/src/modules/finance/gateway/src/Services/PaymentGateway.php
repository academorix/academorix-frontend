<?php

declare(strict_types=1);

namespace Stackra\Gateway\Services;

use Stackra\Gateway\Contracts\Services\PaymentGatewayInterface;
use Stackra\Gateway\Data\PaymentIntentRequest;
use Stackra\Gateway\Data\PaymentIntentResponse;
use Stackra\Gateway\Data\RefundRequest;
use Stackra\Gateway\Data\RefundResponse;
use Stackra\Gateway\Data\WebhookEnvelope;
use Stackra\Gateway\Exceptions\GatewayUnsupportedProviderException;
use Stackra\Gateway\Exceptions\WebhookSignatureInvalidException;
use Illuminate\Container\Attributes\Scoped;

/**
 * Null-object default for {@see PaymentGatewayInterface}.
 *
 * This class exists so the container can satisfy a
 * `PaymentGatewayInterface` type-hint in dev / test environments
 * where NO real driver has been registered yet. Every method throws
 * `GatewayUnsupportedProviderException` with a clear message pointing
 * the caller at `PaymentGatewayManagerInterface::driver($provider)`.
 *
 * Production consumers MUST resolve through the manager, not this class.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Scoped]
final class PaymentGateway implements PaymentGatewayInterface
{
    public function provider(): string
    {
        return 'noop';
    }

    public function createIntent(PaymentIntentRequest $request): PaymentIntentResponse
    {
        $this->fail(__METHOD__);
    }

    public function confirmIntent(string $providerIntentId, ?string $paymentMethodId = null): PaymentIntentResponse
    {
        $this->fail(__METHOD__);
    }

    public function captureIntent(string $providerIntentId, ?int $amountMinor = null): PaymentIntentResponse
    {
        $this->fail(__METHOD__);
    }

    public function cancelIntent(string $providerIntentId, string $reason = 'requested_by_customer'): PaymentIntentResponse
    {
        $this->fail(__METHOD__);
    }

    public function retrieveIntent(string $providerIntentId): PaymentIntentResponse
    {
        $this->fail(__METHOD__);
    }

    public function refund(RefundRequest $request): RefundResponse
    {
        $this->fail(__METHOD__);
    }

    public function verifyWebhookSignature(string $payload, string $signature, string $secret): void
    {
        throw new WebhookSignatureInvalidException(
            'PaymentGateway (noop): signature verification requires a real driver — '
            . 'call PaymentGatewayManagerInterface::driver($provider).',
        );
    }

    public function parseWebhook(string $payload): WebhookEnvelope
    {
        $this->fail(__METHOD__);
    }

    public function ensureCustomer(
        string $tenantId,
        string $localCustomerId,
        string $email,
        ?string $name = null,
        array $metadata = [],
    ): string {
        $this->fail(__METHOD__);
    }

    /**
     * @return never
     */
    private function fail(string $method): void
    {
        throw new GatewayUnsupportedProviderException(sprintf(
            'PaymentGateway (noop): %s cannot run without a real driver — '
            . 'resolve one via PaymentGatewayManagerInterface::driver("stripe" | "paddle" | ...).',
            $method,
        ));
    }
}
