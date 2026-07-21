<?php

declare(strict_types=1);

namespace Stackra\Subscription\Contracts\Services;

use Stackra\Subscription\Enums\SubscriptionProvider;
use Stackra\Subscription\Services\DefaultCashierAdapter;
use Illuminate\Container\Attributes\Bind;

/**
 * Provider-agnostic adapter over Laravel Cashier.
 *
 * Cashier ships two variants — `laravel/cashier-stripe` and
 * `laravel/cashier-paddle`. Which one is loaded for a given tenant
 * is decided by the Application's `payment_provider` setting. This
 * adapter is the seam the rest of the module uses so callers do not
 * import Cashier's own classes directly.
 *
 * The default implementation is a no-op suitable for tests + fresh
 * scaffolds that lack Cashier — production apps override the binding
 * with a Cashier-backed implementation.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(DefaultCashierAdapter::class)]
interface CashierAdapterInterface
{
    /**
     * Which payment provider the caller resolves to for a specific
     * tenant. Reads the Application's payment_provider column.
     *
     * @param  string  $tenantId  Owning tenant.
     */
    public function providerForTenant(string $tenantId): SubscriptionProvider;

    /**
     * Create a checkout session at the provider and return a URL the
     * client can redirect to. Returns null when the provider is
     * `invoice` (offline PO — no Cashier round-trip).
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  string  $priceId   Provider price id (Stripe / Paddle).
     */
    public function createCheckoutSession(string $tenantId, string $priceId): ?string;

    /**
     * Redirect URL for the provider's customer billing portal.
     *
     * @param  string  $tenantId    Owning tenant.
     * @param  string  $returnUrl   Where the provider should redirect back to.
     */
    public function billingPortalUrl(string $tenantId, string $returnUrl): ?string;

    /**
     * Report metered usage to the provider. Returns the provider's
     * usage-record id when the call succeeds; null when the tenant's
     * provider is `invoice`.
     *
     * @param  string  $tenantId        Owning tenant.
     * @param  string  $priceId         Provider price id being metered.
     * @param  int     $amount          Usage delta.
     * @param  int|null $timestamp      Unix seconds; null = now.
     */
    public function reportUsage(string $tenantId, string $priceId, int $amount, ?int $timestamp = null): ?string;
}
