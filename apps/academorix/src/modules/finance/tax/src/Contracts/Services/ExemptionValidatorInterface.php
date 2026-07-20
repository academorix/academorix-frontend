<?php

declare(strict_types=1);

namespace Academorix\Tax\Contracts\Services;

use Academorix\Tax\Data\ExemptionVerdictData;
use Academorix\Tax\Services\ExemptionValidator;
use Illuminate\Container\Attributes\Bind;

/**
 * Tax-exemption validator.
 *
 * A `TaxExemption` row certifies that a customer is exempt from a
 * subset of taxes in a jurisdiction (US 501(c)(3) non-profit,
 * cross-border B2B reverse charge, diplomatic exemption, etc.).
 * The validator checks:
 *  - The exemption exists + belongs to the tenant.
 *  - The exemption covers the specified jurisdiction.
 *  - The exemption is active at `$date` (not expired, not revoked).
 *  - The exemption's `certificate_status` is `verified` (not
 *    `pending_review` — pending exemptions do NOT zero tax).
 *
 * A failing check returns a verdict with `valid = false` + a
 * machine-readable `reason` so callers can surface the specific
 * failure to the operator without leaking implementation detail.
 *
 * Concrete: {@see ExemptionValidator}.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[Bind(ExemptionValidator::class)]
interface ExemptionValidatorInterface
{
    /**
     * Validate an exemption at a point in time.
     *
     * @param  string             $tenantId        Owning tenant.
     * @param  string             $exemptionId     Bound TaxExemption id.
     * @param  string             $jurisdictionId  Jurisdiction the calc is for.
     * @param  \DateTimeImmutable $date            Transaction date.
     */
    public function validate(
        string $tenantId,
        string $exemptionId,
        string $jurisdictionId,
        \DateTimeImmutable $date,
    ): ExemptionVerdictData;
}
