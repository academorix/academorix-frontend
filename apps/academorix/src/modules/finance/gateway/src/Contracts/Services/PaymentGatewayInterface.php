<?php

declare(strict_types=1);

namespace Academorix\Gateway\Contracts\Services;

use Academorix\Gateway\Data\PaymentIntentRequest;
use Academorix\Gateway\Data\PaymentIntentResponse;
use Academorix\Gateway\Data\RefundRequest;
use Academorix\Gateway\Data\RefundResponse;
use Academorix\Gateway\Data\WebhookEnvelope;

/**
 * Provider-agnostic payment-gateway contract.
 *
 * Every concrete driver (Stripe, Paddle, Checkout.com, Square, Razorpay)
 * implements this contract. Downstream modules (finance/payment,
 * finance/refund, finance/chargeback, finance/payout, finance/dunning)
 * type-hint against this interface and NEVER against a concrete driver
 * — the manager resolves the right driver per (tenant, provider) tuple.
 *
 * Design rules:
 *
 *  - **PCI**: NEVER accept raw card data. Consumers tokenise on the client
 *    via the provider's JS SDK (`stripe.js`, `checkout.com Frames`) and
 *    hand a token / payment_method id up the stack.
 *  - **Idempotency**: every mutating call carries an `idempotencyKey`
 *    (client-supplied when the caller can re-issue the same request; the
 *    driver auto-generates a ULID otherwise). Providers dedupe on the key.
 *  - **Amounts**: minor units only (integer cents). Currency is ISO-4217.
 *  - **Errors**: drivers translate provider-specific error shapes into
 *    `Academorix\Gateway\Exceptions\*` subclasses of `AcademorixException`.
 *  - **Webhooks**: `verifyWebhookSignature()` + `parseWebhook()` split the
 *    two responsibilities — signature verify is a security concern (must
 *    NEVER be bypassed); parse is a mapping concern (may evolve per
 *    provider release).
 *
 * There is NO `#[Bind]` attribute on this interface — the container
 * resolves a driver via the `PaymentGatewayManagerInterface` given a
 * provider slug + tenant context, not a single default binding.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
interface PaymentGatewayInterface
{
    /**
     * Provider slug for this driver instance (`stripe`, `paddle`, ...).
     */
    public function provider(): string;

    /**
     * Create a payment intent.
     *
     * @param  PaymentIntentRequest  $request  Amount + currency + customer + metadata.
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException  On provider error.
     *
     * @return PaymentIntentResponse  Client-facing confirmation payload.
     */
    public function createIntent(PaymentIntentRequest $request): PaymentIntentResponse;

    /**
     * Confirm a payment intent (server-side confirmation flow).
     *
     * Most tenants use client-side confirmation (via the provider's JS
     * SDK), but this method covers the off-session / MOTO / backfill paths.
     *
     * @param  string                $providerIntentId Provider-side intent id.
     * @param  string|null           $paymentMethodId  Optional pre-tokenised method.
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException
     *
     * @return PaymentIntentResponse  Post-confirmation status.
     */
    public function confirmIntent(string $providerIntentId, ?string $paymentMethodId = null): PaymentIntentResponse;

    /**
     * Capture a previously-authorised intent.
     *
     * Consumers with `capture=false` on `createIntent()` call this to
     * complete the charge — used for holds (bookable resources), delayed
     * capture (fraud review), and partial captures.
     *
     * @param  string   $providerIntentId Provider-side intent id.
     * @param  int|null $amountMinor      `null` = full authorised amount; integer = partial capture.
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException
     */
    public function captureIntent(string $providerIntentId, ?int $amountMinor = null): PaymentIntentResponse;

    /**
     * Cancel a payment intent that hasn't been captured yet.
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException
     */
    public function cancelIntent(string $providerIntentId, string $reason = 'requested_by_customer'): PaymentIntentResponse;

    /**
     * Retrieve a payment intent by provider id (audit / reconciliation).
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException
     */
    public function retrieveIntent(string $providerIntentId): PaymentIntentResponse;

    /**
     * Refund a captured payment.
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException
     */
    public function refund(RefundRequest $request): RefundResponse;

    /**
     * Verify a webhook's signature against the provider's shared secret.
     *
     * Called by the webhook receiver BEFORE any parsing. A mismatch throws
     * `WebhookSignatureInvalidException` and the receiver refuses the
     * request with HTTP 400.
     *
     * @param  string  $payload    Raw webhook body (bytes — no JSON parsing).
     * @param  string  $signature  Provider-supplied signature header.
     * @param  string  $secret     Provider-side webhook signing secret from Doppler.
     *
     * @throws \Academorix\Gateway\Exceptions\WebhookSignatureInvalidException
     */
    public function verifyWebhookSignature(string $payload, string $signature, string $secret): void;

    /**
     * Parse a verified webhook payload into the provider-agnostic envelope.
     *
     * @param  string  $payload  Verified raw payload.
     *
     * @throws \Academorix\Gateway\Exceptions\PaymentGatewayException  On unparseable payload.
     */
    public function parseWebhook(string $payload): WebhookEnvelope;

    /**
     * Create (or return the existing) provider-side customer record.
     *
     * @param  string                $tenantId
     * @param  string                $localCustomerId  Local User/Athlete id.
     * @param  string                $email
     * @param  string|null           $name
     * @param  array<string, mixed>  $metadata
     *
     * @return string  Provider-side customer id.
     */
    public function ensureCustomer(
        string $tenantId,
        string $localCustomerId,
        string $email,
        ?string $name = null,
        array $metadata = [],
    ): string;
}
