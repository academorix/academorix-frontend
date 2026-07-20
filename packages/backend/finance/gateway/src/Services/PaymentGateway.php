<?php

declare(strict_types=1);

namespace Academorix\Gateway\Services;

use Academorix\Gateway\Contracts\Services\PaymentGatewayInterface;
use Academorix\Gateway\Data\PaymentIntentRequest;
use Academorix\Gateway\Data\PaymentIntentResponse;
use Academorix\Gateway\Data\RefundRequest;
use Academorix\Gateway\Data\RefundResponse;
use Academorix\Gateway\Data\WebhookEnvelope;
use Academorix\Gateway\Exceptions\GatewayUnsupportedProviderException;
use Academorix\Gateway\Exceptions\WebhookSignatureInvalidException;
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
