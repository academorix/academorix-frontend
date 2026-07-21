<?php

declare(strict_types=1);

namespace Stackra\Tax\Contracts\Services;

use Stackra\Tax\Models\TaxRate;
use Stackra\Tax\Services\TaxRateResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Point-in-time tax-rate lookup for a jurisdiction.
 *
 * A jurisdiction's rate can change at fiscal-year boundaries
 * (VAT increases in Ireland from 21% to 23%, sales-tax updates
 * in US states), so every rate row on `tax_rates` carries
 * `effective_from` + `effective_to` timestamps. This resolver
 * answers: "which rate applies to a transaction dated D in
 * jurisdiction J?"
 *
 * The lookup is deterministic + cacheable — the same
 * `(jurisdiction, date, category)` tuple always returns the same
 * rate. Callers should memoise per-request when doing bulk
 * calculations (e.g. one invoice with 30 line items).
 *
 * Concrete: {@see TaxRateResolver}.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[Bind(TaxRateResolver::class)]
interface TaxRateResolverInterface
{
    /**
     * Return the tax rate row applicable to a transaction.
     *
     * @param  string             $tenantId        Owning tenant.
     * @param  string             $jurisdictionId  Bound TaxJurisdiction id.
     * @param  \DateTimeImmutable $date            Transaction date (invoice date, payment date, ...).
     * @param  string             $category        Rate category — `standard`, `reduced`, `zero`, `exempt`. Default `standard`.
     *
     * @return TaxRate|null  The applicable rate row, or null when the
     *   jurisdiction has no rate on record for that (date, category).
     */
    public function resolve(
        string $tenantId,
        string $jurisdictionId,
        \DateTimeImmutable $date,
        string $category = 'standard',
    ): ?TaxRate;
}
