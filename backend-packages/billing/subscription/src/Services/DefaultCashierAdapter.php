<?php

declare(strict_types=1);

namespace Academorix\Subscription\Services;

use Academorix\Subscription\Contracts\Services\CashierAdapterInterface;
use Academorix\Subscription\Enums\SubscriptionProvider;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default (no-op) implementation of {@see CashierAdapterInterface}.
 *
 * Suitable for tests and fresh scaffolds that lack `laravel/cashier`.
 * Production apps override the binding with a Cashier-backed
 * implementation that resolves the Application's payment_provider,
 * builds Stripe / Paddle checkout sessions, and reports metered usage.
 *
 * `#[Scoped]` because a real Cashier adapter holds tenant-scoped
 * clients (an authenticated Stripe / Paddle client per tenant).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultCashierAdapter implements CashierAdapterInterface
{
    /**
     * {@inheritDoc}
     *
     * The default implementation reads the configured fallback
     * provider from `subscription.cashier.default_provider`.
     * Production adapters read the Application's own setting.
     */
    public function providerForTenant(string $tenantId): SubscriptionProvider
    {
        // Tenant id parameter is retained for the production adapter's
        // signature; the default implementation ignores it and returns
        // the configured fallback.
        unset($tenantId);

        $default = (string) \config('subscription.cashier.default_provider', 'stripe');

        return SubscriptionProvider::tryFrom($default) ?? SubscriptionProvider::Stripe;
    }

    /**
     * {@inheritDoc}
     *
     * The default implementation returns null so callers can decide
     * how to react — typically fail-soft with a `checkout_provider_error`
     * response.
     */
    public function createCheckoutSession(string $tenantId, string $priceId): ?string
    {
        unset($tenantId, $priceId);

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function billingPortalUrl(string $tenantId, string $returnUrl): ?string
    {
        unset($tenantId, $returnUrl);

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function reportUsage(string $tenantId, string $priceId, int $amount, ?int $timestamp = null): ?string
    {
        unset($tenantId, $priceId, $amount, $timestamp);

        return null;
    }
}
