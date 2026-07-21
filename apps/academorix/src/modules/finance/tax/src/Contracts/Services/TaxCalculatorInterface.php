<?php

declare(strict_types=1);

namespace Stackra\Tax\Contracts\Services;

use Stackra\Tax\Data\TaxCalculationResultData;
use Stackra\Tax\Data\TaxLineInputData;
use Stackra\Tax\Services\TaxCalculator;
use Illuminate\Container\Attributes\Bind;

/**
 * Line-by-line tax calculator.
 *
 * Given a set of invoice/quote lines + a customer's jurisdiction,
 * this service computes the total tax owed per line and per
 * jurisdiction level (federal / state / county / city). The result
 * is a rich object callers persist to `tax_calculations` for audit
 * + attach to the invoice.
 *
 * Exemption handling is delegated to `ExemptionValidator` — this
 * service reads its verdict but does not decide it. When a line
 * is exempt, its `tax_cents` is zero + a `reason` string surfaces
 * on the result.
 *
 * Concrete: {@see TaxCalculator}.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[Bind(TaxCalculator::class)]
interface TaxCalculatorInterface
{
    /**
     * Compute tax for a set of lines against a jurisdiction.
     *
     * @param  string             $tenantId        Owning tenant.
     * @param  string             $jurisdictionId  Bound TaxJurisdiction id.
     * @param  \DateTimeImmutable $date            Transaction date — drives which rate row applies.
     * @param  list<TaxLineInputData>  $lines      Line-item inputs (amount + category).
     * @param  string|null        $exemptionId    Bound TaxExemption id when the customer holds a certificate.
     */
    public function calculate(
        string $tenantId,
        string $jurisdictionId,
        \DateTimeImmutable $date,
        array $lines,
        ?string $exemptionId = null,
    ): TaxCalculationResultData;
}
