<?php

declare(strict_types=1);

namespace Stackra\Tax\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Aggregate result of {@see \Stackra\Tax\Services\TaxCalculator::calculate}.
 *
 * Serialised to the caller and persisted to `tax_calculations` for
 * audit. Each line's per-jurisdiction breakdown lives in `lines`;
 * the top-level totals are pre-computed so consumers don't need to
 * re-sum on the client side.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TaxCalculationResultData extends Data
{
    /**
     * @param  string                                     $jurisdictionId        Bound TaxJurisdiction id used for the calc.
     * @param  string                                     $date                  ISO-8601 date used for rate resolution.
     * @param  string                                     $currency              ISO-4217 currency code inferred from the lines.
     * @param  int                                        $subtotalCents         Sum of every line's pre-tax amount.
     * @param  int                                        $taxCents              Sum of every line's tax amount.
     * @param  int                                        $totalCents            subtotalCents + taxCents.
     * @param  DataCollection<int, TaxLineResultData>     $lines                 Per-line breakdown.
     * @param  bool                                       $exempt                True when the calling customer holds a valid exemption.
     * @param  string|null                                $exemptionReason       Human-readable reason when `exempt` is true.
     */
    public function __construct(
        public string $jurisdictionId,
        public string $date,
        public string $currency,
        public int $subtotalCents,
        public int $taxCents,
        public int $totalCents,
        public DataCollection $lines,
        public bool $exempt,
        public ?string $exemptionReason = null,
    ) {
    }
}
