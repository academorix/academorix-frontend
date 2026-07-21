<?php

declare(strict_types=1);

namespace Stackra\Chargeback\Contracts\Services;

use Stackra\Chargeback\Enums\ChargebackNetwork;
use Stackra\Chargeback\Services\NetworkFeeCalculator;
use Illuminate\Container\Attributes\Bind;

/**
 * Card-network chargeback fee schedule.
 *
 * Every network charges the merchant a fee per chargeback filed —
 * distinct from the disputed amount itself. The fee lands on the
 * `ChargebackNetworkFeeRecorded` event and is entered against the
 * tenant's ledger separately from the disputed principal. This
 * service is the single source of truth for those fees.
 *
 * Concrete: {@see NetworkFeeCalculator}.
 *
 * @category Chargeback
 *
 * @since    0.1.0
 */
#[Bind(NetworkFeeCalculator::class)]
interface NetworkFeeCalculatorInterface
{
    /**
     * Return the chargeback fee (in cents) for a network + currency.
     *
     * @param  ChargebackNetwork  $network   Card network the chargeback was filed on.
     * @param  string             $currency  ISO-4217 currency code.
     */
    public function feeCentsFor(ChargebackNetwork $network, string $currency): int;
}
