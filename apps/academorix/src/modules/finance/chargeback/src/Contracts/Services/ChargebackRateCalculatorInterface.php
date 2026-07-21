<?php

declare(strict_types=1);

namespace Stackra\Chargeback\Contracts\Services;

use Stackra\Chargeback\Data\ChargebackRateData;
use Stackra\Chargeback\Services\ChargebackRateCalculator;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the trailing-window chargeback-rate computation.
 *
 * Card networks (Visa, Mastercard, Amex, Discover) all publish
 * per-merchant chargeback-rate thresholds — exceed them and the
 * merchant lands on the "monitoring program" list (VDMP, MCC's
 * Chargeback Monitoring, etc.) with elevated fees + possible
 * account termination. This service is the internal early-warning
 * signal: it computes the tenant's rolling rate over the last N
 * days and fires `ChargebackRateThresholdExceeded` when the rate
 * crosses a config threshold (default 0.9% — 90 bp under Visa's
 * 1.0% VDMP entry rate so we alert BEFORE the network does).
 *
 * Concrete: {@see ChargebackRateCalculator}.
 *
 * @category Chargeback
 *
 * @since    0.1.0
 */
#[Bind(ChargebackRateCalculator::class)]
interface ChargebackRateCalculatorInterface
{
    /**
     * Compute the trailing chargeback rate for a tenant.
     *
     * @param  string  $tenantId    Owning tenant.
     * @param  int     $windowDays  Trailing window size in days (default 30).
     *
     * @return ChargebackRateData  chargebacksCount, transactionsCount, ratePercent, threshold, exceeded.
     */
    public function computeFor(string $tenantId, int $windowDays = 30): ChargebackRateData;
}
