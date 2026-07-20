# finance/tax — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null` (29 actions is the largest surface)

## Implementation plan

The tax module owns:
1. **Tax rates** — per-region per-jurisdiction rates (US: state + county;
   EU: country VAT; GCC: country + emirate).
2. **Tax rules** — mapping (product_category, region) → rate.
3. **Tax calculator** — pure computation for `line_amount + rate → tax_amount`.
4. **Tax reporting** — periodic tax filings + exemption certificates.

### The core value object

```php
final readonly class TaxComputation {
    public function __construct(
        public int $lineAmountMinor,
        public int $taxAmountMinor,
        public string $currency,
        public string $jurisdiction,
        public float $ratePercent,
        public string $ruleId,
    ) {}
}
```

### Actions to fill (29 total)

Standard CRUD across `tax_rates`, `tax_rules`, `tax_registrations`,
`tax_exemption_certificates`. Plus these domain-specific actions:

- `ComputeTaxAction` — POST /tax/compute — synchronous compute for a
  proposed line. Used by cart preview.
- `ListTaxReportAction` — GET /tax/reports — periodic filings.
- `GenerateTaxReportAction` — POST /tax/reports — kicks off a
  `GenerateTaxReportJob` for the requested period.
- `ValidateExemptionCertificateAction` — POST /tax/exemptions/{cert}/validate
  — admin-triggered validation (some jurisdictions require verification
  against a state database).

### Support services

- `TaxRateResolver` (Services/) — given a (line, jurisdiction) pair,
  returns the applicable `TaxRate` row. Handles overlapping rate rules
  (US state + county + city; Canadian GST + PST).
- `TaxCalculator` (Services/) — the pure computation service. Called by
  `finance/invoice` at line creation.
- `TaxReporter` (Services/, background job) — aggregates
  `transactions.tax_amount_minor` per jurisdiction for a period.
- `AvalaraAdapter` (Services/, OPTIONAL) — for enterprise tenants with
  a real tax engine subscription. Falls back to the internal
  `TaxCalculator` when not configured.

### Events

- `TaxRateCreated` / `TaxRateUpdated` / `TaxRateArchived`.
- `TaxRuleUpdated` — audit critical, changes revenue recognition.
- `TaxReportGenerated`.

### Blueprint mapping

The 29 actions map to 4-5 aggregates (TaxRate, TaxRule, TaxRegistration,
TaxExemption, TaxReport). Every aggregate has the CRUD + a handful of
domain-specific actions. Follow the coupon pattern: standard CRUD
delegates to `RepositoryInterface`, domain actions delegate to
`TaxCalculator` / `TaxReporter`.
