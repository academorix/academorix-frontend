<?php

declare(strict_types=1);

namespace Academorix\Gateway\Contracts\Services;

use Academorix\Gateway\Services\StripeGatewayDriver;
use Illuminate\Container\Attributes\Bind;

/**
 * Stripe-specific extension of {@see PaymentGatewayInterface}.
 *
 * Adds Stripe-only surfaces (Connect account onboarding, application_fee
 * wiring for marketplace, Setup Intents for SCA / off-session). Every
 * other provider driver extends `PaymentGatewayInterface` directly.
 *
 * Concrete: {@see StripeGatewayDriver}.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Bind(StripeGatewayDriver::class)]
interface StripeGatewayDriverInterface extends PaymentGatewayInterface
{
    /**
     * Create a Stripe Connect Express account for a tenant.
     *
     * @param  string  $tenantId
     * @param  string  $countryCode  ISO 3166-1 alpha-2.
     * @param  string  $email
     *
     * @return string  Connect account id (`acct_*`).
     */
    public function createConnectAccount(string $tenantId, string $countryCode, string $email): string;

    /**
     * Generate an Account Link URL for a tenant to complete onboarding.
     *
     * @param  string  $accountId    Stripe Connect account id.
     * @param  string  $refreshUrl   Return URL for expired links.
     * @param  string  $returnUrl    Return URL after successful onboarding.
     */
    public function createAccountLink(string $accountId, string $refreshUrl, string $returnUrl): string;

    /**
     * Retrieve the current Connect account balance (available + pending).
     *
     * @return array{available_minor: int, pending_minor: int, currency: string}
     */
    public function retrieveConnectBalance(string $accountId, string $currency): array;

    /**
     * Create a Setup Intent for a customer (attach a payment method for
     * future off-session use — subscriptions, dunning retry).
     *
     * @return array{setup_intent_id: string, client_secret: string}
     */
    public function createSetupIntent(string $providerCustomerId, array $metadata = []): array;
}
