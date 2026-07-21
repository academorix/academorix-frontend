<?php

declare(strict_types=1);

namespace Stackra\Gateway\Services;

use Stackra\Gateway\Contracts\Data\PaymentGatewayConfigInterface;
use Stackra\Gateway\Contracts\Repositories\PaymentGatewayConfigRepositoryInterface;
use Stackra\Gateway\Contracts\Services\PaymentGatewayInterface;
use Stackra\Gateway\Contracts\Services\PaymentGatewayManagerInterface;
use Stackra\Gateway\Exceptions\GatewayUnsupportedProviderException;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Container\Container;

/**
 * Reference implementation of
 * {@see \Stackra\Gateway\Contracts\Services\PaymentGatewayManagerInterface}.
 *
 * Resolves a `PaymentGatewayInterface` driver for a given provider slug or
 * tenant. Drivers register themselves at boot via the service provider,
 * OR at runtime via `extend()` (tests + feature-flag driven swaps).
 *
 * `#[Scoped]` — resolves per-request state (active tenant → active driver).
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Scoped]
final class PaymentGatewayManager implements PaymentGatewayManagerInterface
{
    /**
     * Registered drivers keyed by provider slug.
     *
     * @var array<string, PaymentGatewayInterface>
     */
    private array $drivers = [];

    /**
     * Custom concrete class-strings the container should resolve for a
     * given provider slug when a driver isn't already registered.
     *
     * @var array<string, class-string<PaymentGatewayInterface>>
     */
    private array $classes = [
        // Populated by the service provider at boot when driver packages
        // are available. Concrete driver implementations live in the
        // per-provider service classes (StripeGatewayDriver, ...).
    ];

    public function __construct(
        private readonly Container $container,
        private readonly PaymentGatewayConfigRepositoryInterface $configs,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function driver(string $provider): PaymentGatewayInterface
    {
        if (isset($this->drivers[$provider])) {
            return $this->drivers[$provider];
        }

        if (isset($this->classes[$provider])) {
            /** @var PaymentGatewayInterface $instance */
            $instance = $this->container->make($this->classes[$provider]);
            $this->drivers[$provider] = $instance;

            return $instance;
        }

        throw new GatewayUnsupportedProviderException(sprintf(
            'PaymentGatewayManager: provider "%s" is not registered — call extend() at boot.',
            $provider,
        ));
    }

    /**
     * {@inheritDoc}
     */
    public function resolveFor(string $tenantId): PaymentGatewayInterface
    {
        // Read the tenant's active provider config — the repository handles
        // the "one active row per tenant" invariant via a partial unique index.
        $config = $this->configs->getModel()->newQuery()
            ->where(PaymentGatewayConfigInterface::ATTR_TENANT_ID, $tenantId)
            ->where(PaymentGatewayConfigInterface::ATTR_IS_ACTIVE, true)
            ->orderByDesc(PaymentGatewayConfigInterface::ATTR_CREATED_AT)
            ->first();

        $provider = $config !== null
            ? (string) $config->getAttribute(PaymentGatewayConfigInterface::ATTR_PROVIDER)
            : (string) config('gateway.default', 'stripe');

        return $this->driver($provider);
    }

    /**
     * {@inheritDoc}
     */
    public function providers(): array
    {
        return array_values(array_unique(array_merge(
            array_keys($this->drivers),
            array_keys($this->classes),
        )));
    }

    /**
     * {@inheritDoc}
     */
    public function extend(string $provider, PaymentGatewayInterface $driver): void
    {
        $this->drivers[$provider] = $driver;
    }

    /**
     * Register a class-string that the container should resolve when
     * `driver($provider)` is called without a matching registered driver.
     * Called from the service provider at boot.
     *
     * @param  class-string<PaymentGatewayInterface>  $class
     */
    public function registerClass(string $provider, string $class): void
    {
        $this->classes[$provider] = $class;
    }
}
