<?php

declare(strict_types=1);

namespace Academorix\Gateway\Contracts\Services;

use Academorix\Gateway\Services\PaymentGatewayManager;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the driver-manager that owns `PaymentGatewayInterface`
 * resolution.
 *
 * Downstream modules (finance/payment, finance/refund, ...) inject THIS
 * interface, then call `driver($provider)` OR `resolveFor($tenantId)` to
 * get a driver they can invoke. This layer of indirection lets the
 * platform swap the active provider per tenant (feature flag) or fall
 * back to a secondary provider on outage.
 *
 * Concrete: {@see PaymentGatewayManager}.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Bind(PaymentGatewayManager::class)]
interface PaymentGatewayManagerInterface
{
    /**
     * Resolve the driver for a given provider slug.
     *
     * @param  string  $provider  `stripe` / `paddle` / `checkout_com` / `square` / `razorpay`.
     *
     * @throws \InvalidArgumentException  When the provider slug is unknown.
     */
    public function driver(string $provider): PaymentGatewayInterface;

    /**
     * Resolve the ACTIVE driver for a given tenant.
     *
     * Reads `payment_gateway_configs.provider` for the tenant's currently-
     * active row; falls back to the platform default when the tenant has
     * no active gateway.
     *
     * @throws \InvalidArgumentException  When no default is configured.
     */
    public function resolveFor(string $tenantId): PaymentGatewayInterface;

    /**
     * Every provider slug this manager can resolve.
     *
     * @return list<string>
     */
    public function providers(): array;

    /**
     * Register (or replace) a driver at runtime. Tests bind fakes through this.
     */
    public function extend(string $provider, PaymentGatewayInterface $driver): void;
}
