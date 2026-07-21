<?php

declare(strict_types=1);

namespace Stackra\Chargeback\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Result of a chargeback-rate computation.
 *
 * Emitted by
 * {@see \Stackra\Chargeback\Services\ChargebackRateCalculator::computeFor}
 * and consumed by:
 *  - The `MonitorChargebackRateJob` (fires `ChargebackRateThresholdExceeded`
 *    when `$exceeded === true`).
 *  - The chargeback dashboard API (`GET /api/v1/chargebacks/rate`).
 *
 * @category Chargeback
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class ChargebackRateData extends Data
{
    /**
     * @param  string  $tenantId          Owning tenant.
     * @param  int     $windowDays        Trailing window size the computation used.
     * @param  int     $chargebacksCount  Chargebacks filed in the window.
     * @param  int     $transactionsCount Successful transactions in the window (denominator).
     * @param  float   $ratePercent       chargebacksCount / transactionsCount * 100, rounded to 4 decimals.
     * @param  float   $thresholdPercent  Configured threshold (e.g. `0.9` for 0.9%).
     * @param  bool    $exceeded          True when ratePercent >= thresholdPercent.
     * @param  string  $computedAt        ISO-8601 timestamp of the computation.
     */
    public function __construct(
        public string $tenantId,
        public int $windowDays,
        public int $chargebacksCount,
        public int $transactionsCount,
        public float $ratePercent,
        public float $thresholdPercent,
        public bool $exceeded,
        public string $computedAt,
    ) {
    }
}
