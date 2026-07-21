<?php

declare(strict_types=1);

namespace Stackra\Chargeback\Services;

use Stackra\Chargeback\Contracts\Data\ChargebackInterface;
use Stackra\Chargeback\Contracts\Repositories\ChargebackRepositoryInterface;
use Stackra\Chargeback\Contracts\Services\ChargebackRateCalculatorInterface;
use Stackra\Chargeback\Data\ChargebackRateData;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\DB;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Database\ConnectionInterface;

/**
 * Reference implementation of
 * {@see \Stackra\Chargeback\Contracts\Services\ChargebackRateCalculatorInterface}.
 *
 * Chargeback rate is computed as a percentage — chargebacks divided
 * by successful transactions in the trailing window. Visa's VDMP
 * threshold is 1.00%; Mastercard's ECM is 1.50%; we alert at 0.90%
 * by default to give operations time to react before the network
 * catches on.
 *
 * The denominator is the count of `transactions.status = succeeded`
 * rows for the tenant in the same window. Because `stackra/transaction`
 * lives in a sibling package we join through raw table names — the
 * generator does not know about cross-module FK constants. If the
 * transaction module changes its table name, this join needs the
 * matching update.
 *
 * `#[Scoped]` — reads the active tenant scope via the injected
 * repository; also reads a config knob for the alert threshold.
 *
 * @category Chargeback
 *
 * @since    0.1.0
 */
#[Scoped]
final class ChargebackRateCalculator implements ChargebackRateCalculatorInterface
{
    /**
     * Default alert threshold — 0.9% (90 basis points). Visa's VDMP
     * enters at 1.00%, so 0.9% leaves ~10 bp of buffer for the
     * merchant to react before the network's own program triggers.
     */
    private const float DEFAULT_THRESHOLD_PERCENT = 0.9;

    public function __construct(
        private readonly ChargebackRepositoryInterface $chargebacks,
        #[DB] private readonly ConnectionInterface $db,
        #[Config('chargeback.rate_threshold_percent', self::DEFAULT_THRESHOLD_PERCENT)]
        private readonly float $thresholdPercent,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function computeFor(string $tenantId, int $windowDays = 30): ChargebackRateData
    {
        $windowStart = (new \DateTimeImmutable())->modify("-{$windowDays} days");

        $chargebacksCount = $this->chargebacks
            ->getModel()
            ->newQuery()
            ->where(ChargebackInterface::ATTR_TENANT_ID, $tenantId)
            ->where(ChargebackInterface::ATTR_FILED_AT, '>=', $windowStart)
            ->count();

        // Successful-transaction denominator. Direct query bypasses
        // the transaction module's repository to avoid a soft
        // cross-module coupling — the join is a read-only reporting
        // read, not a domain mutation.
        $transactionsCount = (int) $this->db
            ->table('transactions')
            ->where('tenant_id', $tenantId)
            ->where('status', 'succeeded')
            ->where('created_at', '>=', $windowStart)
            ->count();

        $ratePercent = $transactionsCount === 0
            ? 0.0
            : round(($chargebacksCount / $transactionsCount) * 100, 4);

        return new ChargebackRateData(
            tenantId: $tenantId,
            windowDays: $windowDays,
            chargebacksCount: $chargebacksCount,
            transactionsCount: $transactionsCount,
            ratePercent: $ratePercent,
            thresholdPercent: $this->thresholdPercent,
            exceeded: $ratePercent >= $this->thresholdPercent,
            computedAt: (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        );
    }
}
