<?php

declare(strict_types=1);

namespace Stackra\Tax\Services;

use Stackra\Tax\Contracts\Data\TaxExemptionInterface;
use Stackra\Tax\Contracts\Repositories\TaxExemptionRepositoryInterface;
use Stackra\Tax\Contracts\Services\ExemptionValidatorInterface;
use Stackra\Tax\Data\ExemptionVerdictData;
use Illuminate\Container\Attributes\Scoped;

/**
 * Reference implementation of
 * {@see \Stackra\Tax\Contracts\Services\ExemptionValidatorInterface}.
 *
 * Fail-closed on every branch — an ambiguous or missing state
 * yields `valid = false`. The tax_exemption row's presence alone
 * is not enough; the certificate must be `verified` and the
 * (jurisdiction, date) tuple must fall inside its coverage.
 *
 * `#[Scoped]` — reads active tenant scope through injected repo.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[Scoped]
final class ExemptionValidator implements ExemptionValidatorInterface
{
    public function __construct(
        private readonly TaxExemptionRepositoryInterface $exemptions,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function validate(
        string $tenantId,
        string $exemptionId,
        string $jurisdictionId,
        \DateTimeImmutable $date,
    ): ExemptionVerdictData {
        $exemption = $this->exemptions->find($exemptionId);
        if ($exemption === null) {
            return new ExemptionVerdictData(false, 'not_found');
        }
        if ((string) $exemption->getAttribute(TaxExemptionInterface::ATTR_TENANT_ID) !== $tenantId) {
            return new ExemptionVerdictData(false, 'not_found');
        }

        // Certificate must be verified — pending / rejected / revoked
        // do NOT zero tax.
        $status = (string) $exemption->getAttribute(TaxExemptionInterface::ATTR_VERIFICATION_STATUS);
        if ($status !== 'verified') {
            return new ExemptionVerdictData(false, match ($status) {
                'pending_review' => 'pending_review',
                'rejected'       => 'rejected',
                'revoked'        => 'revoked',
                default          => 'not_verified',
            });
        }

        // Effective-window check.
        $validFrom = $exemption->getAttribute(TaxExemptionInterface::ATTR_VALID_FROM);
        $validUntil = $exemption->getAttribute(TaxExemptionInterface::ATTR_VALID_UNTIL);
        if ($validFrom instanceof \DateTimeInterface && $date < \DateTimeImmutable::createFromInterface($validFrom)) {
            return new ExemptionVerdictData(false, 'not_yet_effective');
        }
        if ($validUntil instanceof \DateTimeInterface && $date >= \DateTimeImmutable::createFromInterface($validUntil)) {
            return new ExemptionVerdictData(false, 'expired');
        }

        // Jurisdiction coverage. The exemption row records the
        // ISSUING jurisdiction — the exemption applies within
        // that jurisdiction only. Cross-jurisdiction exemption
        // treaties (e.g. EU-wide VAT exemption) are outside the
        // scope of the shipped schema and require a follow-up
        // `tax_exemption_jurisdictions` pivot table.
        $issuing = (string) $exemption->getAttribute(TaxExemptionInterface::ATTR_ISSUING_JURISDICTION_ID);
        if ($issuing !== '' && $issuing !== $jurisdictionId) {
            return new ExemptionVerdictData(false, 'wrong_jurisdiction');
        }

        return new ExemptionVerdictData(true);
    }
}
