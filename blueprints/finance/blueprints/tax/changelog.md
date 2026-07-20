# tax — changelog

## [Unreleased] — inception (Wave 4)

- Tax module authored. Four owned entities:
  - `TaxRate` — per-jurisdiction rate rows with effective_from/effective_to time bounds. ULID prefix `txr_`.
  - `TaxJurisdiction` — country/state/city rule catalog. ULID prefix `txj_`. tenant_id nullable (null = platform reference data).
  - `TaxExemption` — per-tenant exemption certificates with certificate document + expiry + jurisdiction scope. ULID prefix `txe_`.
  - `TaxCalculation` — per-invoice-line tax computation record. IMMUTABLE audit trail. ULID prefix `txc_`.
- Eight entitlement gates:
  - `tax_capture` (boolean, all tiers) — master feature gate.
  - `tax_provider_slot` (integer per tier — Small=1, Medium=3, Enterprise=∞) — how many provider configs.
  - `tax_advanced_providers` (Medium+) — TaxJar + Avalara AvaTax + Stripe Tax.
  - `tax_jurisdiction_custom` (Enterprise) — add custom jurisdictions beyond platform reference set.
  - `tax_exemption_management` (Small+) — exemption certificate workflow.
  - `tax_multi_currency` (Medium+) — support multiple source_currency values on tax_calculations.
  - `tax_annual_report` (Small+) — end-of-year tax summary export.
  - `tax_extended_retention` (Enterprise) — 7y → 10y retention on tax_calculations.
- MultipleInstanceManager pattern via `TaxProviderManager` with 5 driver families day-1: taxjar, avalara, stripe_tax, native_calculator, custom_webhook.
- Calculation-freeze pattern — `tax_calculations` are immutable after commit. `tax_rate_snapshot` + `exemption_applied` jsonb frozen at calculation time. Rate changes AFTER invoice issuance never retroactively re-tax historical invoices.
- Two-phase exemption verification: (1) at exemption-create observer validates certificate URL + dates + entitlement; dispatches `VerifyTaxExemptionJob` for jurisdictions with public registries. (2) at calculation-time `TaxCalculator` reads exemptions for (tenant, customer, jurisdiction, exemption_type) with verification_status='verified' and applies + snapshots.
- Fail-safe provider policy — NO provider fallback chaining. One provider per calculation. Failure blocks the invoice line (never silently downgrades to native calculator; under-charging tax is a compliance violation).
- Address → jurisdiction resolution via `TaxAddressResolver` (customer profile → shipping/billing address → most-specific matching jurisdiction; postal_code_pattern regex for US sales tax).
- Retry with exponential backoff (transient failures — 3 attempts before circuit-breaker opens) + per-tenant-per-provider circuit-breaker.
- 14 events published; 5 notification categories; 7 background jobs; 11 Artisan commands.
- 3 broadcast channels: `tenant.{id}.tax`, `tenant.{id}.tax.exemptions`, `tenant.{id}.tax.providers`.
- SDUI: 13 screens (tax-rate list/create/edit + sync, tax-jurisdiction list/create/edit, tax-exemption list/create + verify + reject, tax-calculation list/detail, tax-provider list/create/edit/test, tax-report annual) + 3 widgets.
- 5 provider config JSON schemas + 3 catalog data files (rate-type-catalog, jurisdiction-country-catalog with 195 ISO countries, exemption-type-catalog).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `region`, `entitlements`, `compliance`.
- Extended by NONE. Wave 4 `coupon`, `membership`, `invoice`, `transaction` are peers (they consume tax at line-create via CalculateTaxForInvoiceLineJob).
- Wave 4 inception release.

### Design notes

- Tax does NOT carry `application_id` / `region_id` / `organization_id` / `scope_node_id`. Every row is tenant-scoped per tenancy-columns.md §3, with the forbidden columns of §5 explicitly absent. Region cascades through the tenant hierarchy (a tenant's region resolves via its belongs-to chain, not via a shortcut FK on tax rows).
- The calculation-freeze pattern is the module's most important invariant. Once `tax_calculations.tax_rate_snapshot` is committed, the row is IMMUTABLE — no soft-delete, no updates. Regulator audits get the exact rate that applied at issuance, not the current rate.
- The tax module treats calculation failures as HARD FAILURES. A failed TaxJar call blocks the invoice line + requires manual intervention. Silently falling back to NativeCalculator would risk under-charging tax (compliance violation).
- Every write to tax_rates / tax_jurisdictions / tax_exemptions / tax_calculations emits an audit row (Auditable trait) with 7-year retention (10 for Enterprise via tax_extended_retention).
- Marketing (Wave 5) fans out to N providers per event; Tax uses EXACTLY ONE provider per calculation. Two providers computing different tax amounts for the same line would be an unresolvable conflict + a compliance nightmare.
- `TaxJurisdiction.tenant_id` is nullable — null = platform-wide reference data (ISO 3166-1 country list, US state jurisdictions, EU VAT jurisdictions). Enterprise-tier tenants can add custom jurisdictions beyond the reference set via `tax_jurisdiction_custom`.
- `TaxExemption.customer_type + customer_id` is polymorphic (User / Athlete / Organization) — the observer validates cross-model tenant integrity on write.
- Certificate documents (`tax_exemptions.certificate_document_url`) are S3 signed URLs with time-limited access + tenant-scoped bucket prefixes. Certificates never leak cross-tenant. The `certificate_document_url` field is encrypted at rest.
- Provider config credentials (`tax_provider_configs.config` jsonb — Wave 4 companion table introduced alongside this module) are encrypted at rest.
- On TenantErased, tax_calculations MIGRATE to a compliance archive linked to invoice retention rather than hard-delete. Reason: regulator may audit an erased tenant's tax history years after the erasure event. The rest of the tax rows (rates, jurisdictions, exemptions) hard-delete via FK CASCADE.

### Compliance

- **VAT MOSS** (EU Mini One Stop Shop) — supports quarterly digital-services VAT filing across EU member states.
- **US Sales Tax Wayfair** (South Dakota v. Wayfair) — `tax_jurisdictions.nexus_type` supports physical / economic / marketplace nexus tracking.
- **GST/HST** — Canadian federal + provincial tax rates.
- **VAT Directive 2006/112/EC** — EU VAT compliance surface.
- **PCI-DSS 10.7** — audit trail retention 1 year hot + 6 years archive for tax_calculations.
- **Records retention** — 7 years minimum per US IRS / EU VAT Directive / UK HMRC / Canadian CRA baselines; 10 years for Enterprise tenants requiring extended retention.
- **GDPR Art. 6(1)(c)** — legal basis for retaining exemption certificates (necessary for compliance with legal obligation — tax authority audit).
- **GDPR Art. 5(1)(c)** — data minimisation. Certificate documents accessed via time-limited signed URLs, never distributed as base64 blobs in API responses.
- **SOC 2 CC6.7** — encryption in transit (TLS 1.2+) + at rest (certificate documents, provider credentials).
