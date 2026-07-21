<?php

declare(strict_types=1);

namespace Stackra\Tax\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Per-line result inside a {@see TaxCalculationResultData}.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TaxLineResultData extends Data
{
    /**
     * @param  string  $lineId          Client-side line id copied from the input.
     * @param  int     $amountCents     Pre-tax amount.
     * @param  int     $taxCents        Computed tax amount.
     * @param  float   $ratePercent     Applied rate as a percentage (e.g. `20.0` for 20%).
     * @param  string  $category        Rate category — `standard` / `reduced` / `zero` / `exempt`.
     * @param  bool    $exempt          True when this line's tax was zeroed by the exemption.
     */
    public function __construct(
        public string $lineId,
        public int $amountCents,
        public int $taxCents,
        public float $ratePercent,
        public string $category,
        public bool $exempt = false,
    ) {
    }
}
