<?php

declare(strict_types=1);

namespace Stackra\Chargeback\Services;

use Stackra\Chargeback\Contracts\Services\NetworkFeeCalculatorInterface;
use Stackra\Chargeback\Enums\ChargebackNetwork;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * Static + configurable fee schedule for card-network chargebacks.
 *
 * Ships a reasonable US-dollar baseline (Visa $15, Mastercard $25,
 * Amex $30, Discover $25, JCB $30, UnionPay $30, Diners $25,
 * other $20). Overridable per-currency via
 * `config('chargeback.network_fees')`.
 *
 * `#[Singleton]` — stateless, pure lookup. See
 * `.kiro/steering/octane-first-di.md`.
 *
 * @category Chargeback
 *
 * @since    0.1.0
 */
#[Singleton]
final class NetworkFeeCalculator implements NetworkFeeCalculatorInterface
{
    /**
     * Default fee schedule in USD cents. Every non-USD currency
     * currently maps back to the USD figure — deployments that need
     * per-currency divergence override via config
     * (`chargeback.network_fees.eur.visa = 1400` etc.).
     *
     * Public network fees as of 2026-Q1:
     *  - Visa:       $15.00 USD  (dispute fee only; VDMP tiers can add more)
     *  - Mastercard: $25.00 USD  (ECM tier 1)
     *  - Amex:       $30.00 USD  (single-source dispute fee)
     *  - Discover:   $25.00 USD
     *  - JCB:        $30.00 USD  (issuer-inclusive)
     *  - UnionPay:   $30.00 USD
     *  - Diners:     $25.00 USD
     *  - Other:      $20.00 USD  (unknown network fallback)
     *
     * @var array<string, int>
     */
    private const array DEFAULT_USD_CENTS = [
        'visa'      => 1500,
        'mastercard' => 2500,
        'amex'      => 3000,
        'discover'  => 2500,
        'jcb'       => 3000,
        'unionpay'  => 3000,
        'diners'    => 2500,
        'other'     => 2000,
    ];

    /**
     * @param  array<string, array<string, int>>  $overrides  Config-driven fee overrides. Shape: `[currency => [network => cents]]`.
     */
    public function __construct(
        #[Config('chargeback.network_fees', [])] private readonly array $overrides = [],
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function feeCentsFor(ChargebackNetwork $network, string $currency): int
    {
        $networkKey = $network->value;
        $currencyKey = strtolower($currency);

        // Explicit per-currency override wins.
        if (isset($this->overrides[$currencyKey][$networkKey])
            && is_int($this->overrides[$currencyKey][$networkKey])
        ) {
            return $this->overrides[$currencyKey][$networkKey];
        }

        // Fall back to the USD baseline. Non-USD currencies inherit
        // the USD-cent figure unmodified — no FX conversion here;
        // deployments must set per-currency overrides when the
        // network publishes local fees.
        return self::DEFAULT_USD_CENTS[$networkKey] ?? self::DEFAULT_USD_CENTS['other'];
    }
}
