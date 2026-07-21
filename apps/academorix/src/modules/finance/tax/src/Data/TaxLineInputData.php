<?php

declare(strict_types=1);

namespace Stackra\Tax\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * One input line to
 * {@see \Stackra\Tax\Services\TaxCalculator::calculate}.
 *
 * Payload shape callers assemble before invoking the calculator —
 * a simplified projection of an invoice line item. Only the
 * fields the calculator needs live here.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TaxLineInputData extends Data
{
    /**
     * @param  string  $lineId       Client-side id (preserved on the result for correlation).
     * @param  int     $amountCents  Pre-tax amount in the smallest currency unit.
     * @param  string  $currency     ISO-4217 currency code.
     * @param  string  $category     Rate category — `standard` / `reduced` / `zero` / `exempt`.
     */
    public function __construct(
        public string $lineId,
        public int $amountCents,
        public string $currency,
        public string $category = 'standard',
    ) {
    }
}
