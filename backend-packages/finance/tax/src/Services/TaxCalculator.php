<?php

declare(strict_types=1);

namespace Academorix\Tax\Services;

use Academorix\Tax\Contracts\Data\TaxRateInterface;
use Academorix\Tax\Contracts\Services\ExemptionValidatorInterface;
use Academorix\Tax\Contracts\Services\TaxCalculatorInterface;
use Academorix\Tax\Contracts\Services\TaxRateResolverInterface;
use Academorix\Tax\Data\TaxCalculationResultData;
use Academorix\Tax\Data\TaxLineResultData;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Psr\Log\LoggerInterface;
use Spatie\LaravelData\DataCollection;

/**
 * Reference implementation of
 * {@see \Academorix\Tax\Contracts\Services\TaxCalculatorInterface}.
 *
 * Algorithm:
 *  1. Ask the ExemptionValidator whether the customer holds a
 *     valid exemption at (jurisdiction, date). When yes, every
 *     line is zeroed and `exempt = true` on the result.
 *  2. For each line, resolve the applicable rate via
 *     TaxRateResolver. Missing rates -> zero tax (log warning).
 *  3. Compute per-line `tax_cents = round(amount * pct / 100)`
 *     using banker's rounding (PHP_ROUND_HALF_EVEN) to match
 *     Stripe Tax for cross-provider consistency.
 *  4. Aggregate.
 *
 * `#[Scoped]` — reads active tenant scope through injected
 * services.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[Scoped]
final class TaxCalculator implements TaxCalculatorInterface
{
    public function __construct(
        private readonly TaxRateResolverInterface $rates,
        private readonly ExemptionValidatorInterface $exemptions,
        #[Log('tax')] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function calculate(
        string $tenantId,
        string $jurisdictionId,
        \DateTimeImmutable $date,
        array $lines,
        ?string $exemptionId = null,
    ): TaxCalculationResultData {
        // 1. Exemption gate.
        $exemption = $exemptionId !== null
            ? $this->exemptions->validate($tenantId, $exemptionId, $jurisdictionId, $date)
            : null;
        $exempt = $exemption?->valid ?? false;
        $exemptionReason = $exemption?->reason;

        $subtotalCents = 0;
        $taxCents = 0;
        $currency = 'usd';
        $lineResults = [];

        foreach ($lines as $line) {
            $subtotalCents += $line->amountCents;
            $currency = $line->currency;

            if ($exempt) {
                $lineResults[] = new TaxLineResultData(
                    lineId: $line->lineId,
                    amountCents: $line->amountCents,
                    taxCents: 0,
                    ratePercent: 0.0,
                    category: $line->category,
                    exempt: true,
                );
                continue;
            }

            $rate = $this->rates->resolve($tenantId, $jurisdictionId, $date, $line->category);
            if ($rate === null) {
                $this->log->warning('tax calculator: no rate on record; defaulting to zero tax', [
                    'jurisdiction_id' => $jurisdictionId,
                    'category'        => $line->category,
                    'date'            => $date->format('c'),
                ]);
                $lineResults[] = new TaxLineResultData(
                    lineId: $line->lineId,
                    amountCents: $line->amountCents,
                    taxCents: 0,
                    ratePercent: 0.0,
                    category: $line->category,
                    exempt: false,
                );
                continue;
            }

            $ratePercent = (float) $rate->getAttribute(TaxRateInterface::ATTR_PERCENTAGE);
            $lineTax = (int) round(
                ($line->amountCents * $ratePercent) / 100.0,
                mode: PHP_ROUND_HALF_EVEN,
            );
            $taxCents += $lineTax;

            $lineResults[] = new TaxLineResultData(
                lineId: $line->lineId,
                amountCents: $line->amountCents,
                taxCents: $lineTax,
                ratePercent: $ratePercent,
                category: $line->category,
                exempt: false,
            );
        }

        return new TaxCalculationResultData(
            jurisdictionId: $jurisdictionId,
            date: $date->format(\DateTimeInterface::ATOM),
            currency: $currency,
            subtotalCents: $subtotalCents,
            taxCents: $taxCents,
            totalCents: $subtotalCents + $taxCents,
            lines: new DataCollection(TaxLineResultData::class, $lineResults),
            exempt: $exempt,
            exemptionReason: $exemptionReason,
        );
    }
}
