<?php

declare(strict_types=1);

namespace Stackra\Gateway\Services;

use Stackra\Gateway\Contracts\Services\StripeGatewayDriverInterface;
use Stackra\Gateway\Data\PaymentIntentRequest;
use Stackra\Gateway\Data\PaymentIntentResponse;
use Stackra\Gateway\Data\RefundRequest;
use Stackra\Gateway\Data\RefundResponse;
use Stackra\Gateway\Data\WebhookEnvelope;
use Stackra\Gateway\Exceptions\PaymentGatewayException;
use Stackra\Gateway\Exceptions\WebhookSignatureInvalidException;
use Illuminate\Container\Attributes\Scoped;

/**
 * Stripe driver — thin adapter over the `stripe/stripe-php` SDK.
 *
 * Every method routes into the Stripe API: `createIntent` -> `PaymentIntent::create`,
 * `refund` -> `Refund::create`, `verifyWebhookSignature` -> `Webhook::constructEvent`.
 *
 * ## TODO — wire the Stripe SDK
 *
 * The concrete SDK calls need to land in a follow-up commit that ships:
 *   1. `stripe/stripe-php ^15` in `composer.json`
 *   2. Doppler-sourced `STRIPE_SECRET_KEY` in `config('gateway.stripe.secret')`
 *   3. `Stripe::setApiKey(...)` bootstrap in the module provider's `#[OnBoot]`.
 *   4. Per-tenant Connect account handling — read the account id from
 *      `PaymentGatewayConfig.connect_account_id` and pass as `Stripe-Account`
 *      request option on every mutating call.
 *   5. Idempotency-key propagation — every mutating call SHOULD carry a
 *      request-scoped ULID by default AND accept an explicit override.
 *
 * Until the SDK lands, every method throws `PaymentGatewayException` with a
 * clear TODO marker so downstream integration surfaces the incomplete state.
 *
 * `#[Scoped]` — resolves tenant + Connect account per request.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Scoped]
final class StripeGatewayDriver implements StripeGatewayDriverInterface
{
    public function provider(): string
    {
        return 'stripe';
    }

    public function createIntent(PaymentIntentRequest $request): PaymentIntentResponse
    {
        // TODO(gateway): wire Stripe\PaymentIntent::create — see class docblock.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::createIntent not yet wired — see class TODO block.',
        );
    }

    public function confirmIntent(string $providerIntentId, ?string $paymentMethodId = null): PaymentIntentResponse
    {
        // TODO(gateway): wire Stripe\PaymentIntent::confirm.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::confirmIntent not yet wired — see class TODO block.',
        );
    }

    public function captureIntent(string $providerIntentId, ?int $amountMinor = null): PaymentIntentResponse
    {
        // TODO(gateway): wire Stripe\PaymentIntent::capture.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::captureIntent not yet wired — see class TODO block.',
        );
    }

    public function cancelIntent(string $providerIntentId, string $reason = 'requested_by_customer'): PaymentIntentResponse
    {
        // TODO(gateway): wire Stripe\PaymentIntent::cancel.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::cancelIntent not yet wired — see class TODO block.',
        );
    }

    public function retrieveIntent(string $providerIntentId): PaymentIntentResponse
    {
        // TODO(gateway): wire Stripe\PaymentIntent::retrieve.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::retrieveIntent not yet wired — see class TODO block.',
        );
    }

    public function refund(RefundRequest $request): RefundResponse
    {
        // TODO(gateway): wire Stripe\Refund::create — accept `amount` in cents,
        // `payment_intent` matching request->providerIntentId, `reason` mapping.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::refund not yet wired — see class TODO block.',
        );
    }

    public function verifyWebhookSignature(string $payload, string $signature, string $secret): void
    {
        // TODO(gateway): call Stripe\Webhook::constructEvent($payload, $signature, $secret).
        // The SDK throws `Stripe\Exception\SignatureVerificationException` on
        // mismatch — catch and re-throw as `WebhookSignatureInvalidException`.
        throw new WebhookSignatureInvalidException(
            'StripeGatewayDriver::verifyWebhookSignature not yet wired — see class TODO block.',
        );
    }

    public function parseWebhook(string $payload): WebhookEnvelope
    {
        // TODO(gateway): decode the Stripe event payload into the
        // provider-agnostic `WebhookEnvelope` — map the `type` field
        // ("payment_intent.succeeded" / "charge.refunded" / "charge.dispute.created" / ...)
        // one-to-one; keep the raw payload for downstream audit.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::parseWebhook not yet wired — see class TODO block.',
        );
    }

    public function ensureCustomer(
        string $tenantId,
        string $localCustomerId,
        string $email,
        ?string $name = null,
        array $metadata = [],
    ): string {
        // TODO(gateway): search Stripe\Customer::search by `metadata:local_id`
        // first; create if missing; return `cus_*`.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::ensureCustomer not yet wired — see class TODO block.',
        );
    }

    public function createConnectAccount(string $tenantId, string $countryCode, string $email): string
    {
        // TODO(gateway): wire Stripe\Account::create for Connect Express accounts.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::createConnectAccount not yet wired — see class TODO block.',
        );
    }

    public function createAccountLink(string $accountId, string $refreshUrl, string $returnUrl): string
    {
        // TODO(gateway): wire Stripe\AccountLink::create.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::createAccountLink not yet wired — see class TODO block.',
        );
    }

    public function retrieveConnectBalance(string $accountId, string $currency): array
    {
        // TODO(gateway): wire Stripe\Balance::retrieve with Stripe-Account
        // request option; sum `available` + `pending` entries matching
        // the target currency.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::retrieveConnectBalance not yet wired — see class TODO block.',
        );
    }

    public function createSetupIntent(string $providerCustomerId, array $metadata = []): array
    {
        // TODO(gateway): wire Stripe\SetupIntent::create.
        throw new PaymentGatewayException(
            'StripeGatewayDriver::createSetupIntent not yet wired — see class TODO block.',
        );
    }
}
