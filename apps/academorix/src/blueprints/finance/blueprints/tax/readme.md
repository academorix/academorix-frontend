# tax

Tax rate + jurisdiction + exemption + calculation engine. Wave 4 finance
infrastructure. The load-bearing tax lane per `.kiro/steering/hierarchy.md` §1b
— answers "what tax is owed on this invoice line in this jurisdiction for this
customer?" for every invoice + membership renewal + coupon-adjusted line item.

## 1. What this module owns

| Concern                             | Owned artefact                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Per-jurisdiction rate rows          | `TaxRate` — one row per (jurisdiction × rate_type × effective_from). Effective-range time bounds.            |
| Country/state/city rule catalog     | `TaxJurisdiction` — VAT / GST / Sales Tax / Consumption Tax / Digital Services Tax rules per geography.      |
| Per-tenant exemption certificates   | `TaxExemption` — reseller / non-profit / diplomatic / rural / religious with certificate + expiry + scope.   |
| Per-invoice-line calculation record | `TaxCalculation` — immutable audit trail of which rate applied when + which provider computed it.            |
| Provider driver family              | `TaxProviderManager` (MultipleInstanceManager) — 5 drivers day-1.                                            |
| Rate resolution                     | `TaxRateResolver` — (jurisdiction, rate_type, applies_to, date) → rate.                                      |
| Address → jurisdiction resolution   | `TaxAddressResolver` — customer profile address → tax_jurisdictions row.                                     |
| Exemption certificate validation    | `ExemptionValidator` — validates certificate against issuing jurisdiction's public registry when available.  |
| Certificate document storage        | `CertificateStorage` — S3 signed URL manager with time-limited access + tenant-scoped prefixes.              |
| Retry + circuit-breaker             | Per (tenant, provider) — Meta AvaTax outage for tenant A does not affect tenant B or Stripe Tax dispatch.    |
| Calculation freeze                  | Once `tax_calculations.tax_rate_snapshot` is committed, IMMUTABLE — rate changes never retroactively re-tax. |
| Annual tax summary                  | Aggregated per-jurisdiction rollup over `tax_calculations` for regulator filing.                             |

### 1.1 The four owned tables

- `tax_rates` — per-jurisdiction rate rows. Belongs to `Tenant` +
  `TaxJurisdiction` (RESTRICT). Retention: indefinite while active + audit trail
  after expiry.
- `tax_jurisdictions` — country/state/city rule catalog. Belongs to `Tenant`
  (nullable — null = platform-wide reference data). Retention: indefinite.
- `tax_exemptions` — per-tenant exemption certificates. Belongs to `Tenant` +
  polymorphic customer (User / Athlete / Organization). Retention: 7 years
  post-expiry.
- `tax_calculations` — per-invoice-line calculation record. Belongs to `Tenant`
  - `invoice_lines.id` (RESTRICT). Retention: 7 years (10 for Enterprise via
    `tax_extended_retention`).

None of these carry `application_id`, `region_id`, `organization_id`, or
`scope_node_id` — every row is tenant-scoped per tenancy-columns.md §3 with the
forbidden columns of §5 explicitly absent. Region cascades through the Tenant
hierarchy (a Tenant's Region is resolved via the tenant's belongs-to chain, not
via a shortcut FK on tax rows). Enforced by the tenancy-compliance-auditor.

## 2. Where this module sits in the finance stack

Wave 4 finance infrastructure. Consumed by:

- **`invoice`** (Wave 4 peer) — every invoice line dispatches
  `CalculateTaxForInvoiceLineJob` at line create; the job resolves the
  customer's tax jurisdiction, computes tax via the tenant's chosen provider,
  and persists a `TaxCalculation` snapshot referenced by the line.
- **`membership`** (Wave 4 peer) — Finance Membership renewals produce invoice
  lines that route through the same tax pipeline.
- **`coupon`** (Wave 4 peer) — coupon redemption adjusts the source amount
  BEFORE tax calculation. The tax module treats coupon-adjusted amounts as the
  authoritative `source_amount_cents`.
- **`transaction`** (Wave 4 peer) — payment processing reads
  `TaxCalculation.tax_rate_snapshot` for regulator reporting + reconciliation.

Distinct from:

- **`marketing`** (Wave 5 growth) — server-side conversion tracking. Marketing
  events may carry a `value_amount_cents` (revenue signal); the tax module
  computes the ACTUAL tax owed on that revenue.
- **`entitlements`** (Wave 3 platform) — tax entitlements (`tax_capture`,
  `tax_provider_slot`, ...) live in entitlements; tax owns the ENGINE that
  consumes those entitlements at write time.

## 3. The MultipleInstanceManager pattern

Per `.kiro/steering/package-conventions.md`, tax uses Laravel's canonical
`Illuminate\Support\MultipleInstanceManager`:

```
TaxProviderManager (extends MultipleInstanceManager)
    → instance('taxjar_ten_abc_config_xyz') → TaxJarProvider driver
    → createTaxjarDriver(config: TaxProviderConfig)
    → createAvalaraDriver(config: TaxProviderConfig)
    → createStripeTaxDriver(config: TaxProviderConfig)
    → createNativeCalculatorDriver(config: TaxProviderConfig)
    → createCustomWebhookDriver(config: TaxProviderConfig)
    → extend(name, factory) → runtime driver registration
```

The instance name for the manager is deterministic per config row —
`<provider>_<tenant_short_id>_<config_ulid>`. Consumers call
`$manager->instance($name)` (or `$manager->forConfig($config)`) to get a
provider driver bound to the tenant's encrypted credentials.

**Provider selection is per-tenant + per-jurisdiction, NOT fan-out.** Unlike
marketing (which broadcasts to N providers per event), tax uses EXACTLY ONE
provider per calculation. Reasoning: two providers computing different tax
amounts for the same line would be an unresolvable conflict + a compliance
nightmare. The tenant admin picks one provider per jurisdiction (defaulting to
NativeCalculator for simple single-country tenants).

## 4. The calculation-freeze pattern

Per finance audit requirements, tax calculations are IMMUTABLE after commit:

- `tax_calculations` rows have NO soft-delete + NO updates after create.
- `tax_rate_snapshot` jsonb freezes the rate percentage + jurisdiction + rate
  ID + effective_at date at calculation time. If the tax authority changes VAT
  from 20% → 22% next quarter, invoices issued before the change stay at 20%.
- `exemption_applied` jsonb snapshots the exemption certificate details at
  calculation time. Certificate revocation post-invoice does not re-tax the
  invoice.
- Retroactive re-computation is IMPOSSIBLE by construction. Regulators receive
  the exact rate that applied at issuance.

## 5. Provider drivers (5 day-1)

Each provider ships:

1. A driver class implementing the `ITaxProvider` contract (`name()`,
   `supports(jurisdiction)`, `calculate(...)`, `syncRates()`).
2. A JSON Schema in `data/providers/<provider>-config.schema.json` for
   `TaxProviderConfig.config` validation.
3. Behaviour-specific implementation of the calculate method.

### 5.1 The 5 providers

| Provider         | Endpoint                                             | Auth                             | Scope                                 |
| ---------------- | ---------------------------------------------------- | -------------------------------- | ------------------------------------- |
| TaxJar           | `https://api.taxjar.com/v2/taxes`                    | `Authorization: Bearer <token>`  | US sales tax + international VAT      |
| Avalara AvaTax   | `https://rest.avatax.com/api/v2/transactions/create` | Basic (`account_id:license_key`) | Enterprise-grade global tax + per-SKU |
| Stripe Tax       | `stripe.tax.calculations.create` (Stripe SDK)        | Stripe API key                   | Automatic on Stripe-processed txns    |
| NativeCalculator | None (local — reads `tax_rates` directly)            | N/A                              | Simple jurisdictions / single-country |
| CustomWebhook    | Caller-configured URL                                | HMAC-SHA256 signature            | Tenant-hosted tax engine escape hatch |

### 5.2 Native calculator

The `NativeCalculator` driver is the module's built-in provider. It:

- Reads `tax_rates` directly for the customer's jurisdiction.
- Applies exemptions via `ExemptionValidator`.
- Produces a `TaxCalculation` snapshot without any HTTP call.
- Zero external dependencies + zero cost.
- Suitable for: single-country tenants, tenants without complex nexus, tenants
  serving digital-only products under a fixed jurisdiction.
- NOT suitable for: US sales tax with economic nexus tracking, EU cross-border
  VAT MOSS, tenants selling into 10+ tax jurisdictions.

Tenants can freely mix providers per jurisdiction — e.g. Avalara for US sales
tax + NativeCalculator for their home-country VAT.

## 6. Address → jurisdiction resolution

`TaxAddressResolver` maps a customer's profile address to a `TaxJurisdiction`
row:

- Reads customer profile (via polymorphic `customer_type` + `customer_id`).
- Prefers shipping address over billing address (correct for physical goods).
- Prefers billing address for digital-only tenants (configurable).
- Falls back to tenant's default_region when address is missing.
- Returns the MOST SPECIFIC matching jurisdiction — city > state > country.
- Handles postal_code_pattern regex matching for zip-based US sales tax
  jurisdictions.

## 7. Exemption verification

Two-phase verification:

1. **At exemption create** — `TaxExemptionObserver.creating` validates
   certificate_document_url is HTTPS S3 signed + validates valid_from <
   valid_until
   - refuses without `tax_exemption_management` entitlement. Dispatches
     `VerifyTaxExemptionJob` when the issuing jurisdiction has a public
     registry.
2. **At calculation time** — `TaxCalculator` reads exemptions for (tenant,
   customer, jurisdiction, exemption_type) with verification_status='verified'
   AND valid_from <= today < valid_until. Applies the exemption + snapshots it
   into `tax_calculations.exemption_applied`.

Certificate revocation is honored going forward but does NOT re-tax historical
invoices (calculation-freeze pattern §4).

## 8. Retry + circuit-breaker

Provider calls fail — the module handles it fail-safe:

- **Retry** — Exponential backoff on transient failures (5xx, timeout, network
  reset). Max 3 attempts before circuit-breaker opens. NO fallback chaining — if
  TaxJar fails, we do NOT silently proceed to NativeCalculator. Reason:
  under-charging tax is a compliance violation; a failed provider call must
  block the invoice line until manually resolved.
- **Circuit-breaker** — Per (tenant, provider). Opens after 5 consecutive
  failures. Fires `TaxProviderCircuitBreakerOpenedNotification` (P1 — pages
  finance ops). Auto-closes after 1h + successful probe.

## 9. Tier gating

- **Small** — NativeCalculator only. 1 provider config. Basic exemption
  management. Annual report enabled.
- **Medium** — All 5 providers. Up to 3 configs. Multi-currency support.
- **Enterprise** — Unlimited configs. Custom jurisdictions beyond platform
  reference. 10-year retention (from 7).

Enforced by `tax_capture` (master) + `tax_provider_slot` (config cap) +
`tax_advanced_providers` (Medium+ enables Avalara + Stripe Tax) +
`tax_jurisdiction_custom` (Enterprise) + `tax_exemption_management` (Small+) +
`tax_multi_currency` (Medium+) + `tax_annual_report` (Small+) +
`tax_extended_retention` (Enterprise).

## 10. What this module does NOT do

- **Tax law interpretation.** The module is an ENGINE — rate values come from
  the provider or tenant admin. Academorix does not offer tax counsel; tenants
  are responsible for their own compliance advisors.
- **Historical rate re-computation.** Calculations frozen at snapshot per §4.
- **Provider fallback chaining.** ONE provider per calculation; failure blocks
  the invoice line (fail-safe against under-charging).
- **Client-side tax calculation.** Server-side only. Frontend never computes tax
  — it displays server-computed snapshots.
- **Cross-tenant tax rate sharing.** Every row is tenant-scoped (except platform
  reference jurisdictions with `tenant_id IS NULL`).
- **`application_id` on any row.** Tax is a domain-plane concern; cascades
  through `tenant_id → tenants.application_id`. Per tenancy-columns.md §2, only
  8 rows carry `application_id` directly; `tax_*` is not among them.
- **`region_id` on any row.** Region cascades through the tenant hierarchy —
  tenants have a default_region + branches carry region_id; tax rows read the
  region indirectly through their jurisdiction's country_code.
- **`organization_id` / `branch_id` / `scope_node_id` on any row.**
- **Payment processing.** That's Wave 4 `transaction` module. Tax computes; tax
  does not charge.

## 11. Cross-references

- `hierarchy.md` §1b — finance module vocabulary (`Membership` vs
  `TenantSubscription`).
- `hierarchy.md` §7 — tier matrix (feature gating).
- `tenancy-columns.md` §3 — every tax table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every tax row.
- `.kiro/steering/package-conventions.md` — MultipleInstanceManager shape.
- `.kiro/steering/hierarchy.md` §11 — the two-signal observability model — every
  tax calculation writes an audit row.
- `modules/growth/blueprints/marketing/` — canonical multi-provider fan-out
  reference (marketing is a peer; tax is more conservative — ONE provider per
  calculation vs marketing's fan-out).
- `modules/billing/blueprints/entitlements/` — the entitlement gate registry.
- `modules/finance/blueprints/invoice/` (Wave 4) — the primary consumer of the
  tax pipeline.
