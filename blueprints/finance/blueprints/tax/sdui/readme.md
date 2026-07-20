# tax — SDUI blueprints

Blueprint declarations for the tax module's server-driven UI surfaces.

## Surfaces

### `resources/tax-rate/`

Tenant-facing tax rate CRUD + provider sync. Owner + admin + finance role.

- `list.screen.json` — filterable rate ledger with active/expired chips +
  percentage-range badges. Filters on jurisdiction, rate_type, applies_to,
  active flag.
- `create.screen.json` — rate creation form with jurisdiction picker + rate
  type picker + percentage input + effective-range date picker.
- `edit.screen.json` — same fields as create. Update refused when the rate has
  been referenced by any tax_calculation (calculation-freeze).
- `sync.screen.json` — trigger on-demand SyncTaxRatesFromProviderJob per
  provider. Shows diff preview + progress.

### `resources/tax-jurisdiction/`

Jurisdiction CRUD. Reads platform-reference (tenant_id IS NULL) + custom.

- `list.screen.json` — filterable jurisdiction browser with country flag +
  tax type chip. Filters on country_code, tax_type, custom-only toggle.
- `create.screen.json` — custom jurisdiction creation. Enterprise-only.
- `edit.screen.json` — same fields as create. Platform-reference edits
  refused unless super_admin.

### `resources/tax-exemption/`

Exemption certificate CRUD + verification workflow. Owner + admin + finance +
compliance.

- `list.screen.json` — filterable exemption queue with verification-status
  chips + expiry badges. Default filter: pending.
- `create.screen.json` — exemption submission form with polymorphic customer
  picker + jurisdiction picker + exemption type picker + certificate upload
  (S3 pre-signed).
- `verify.screen.json` — dedicated verify flow: shows the certificate document
  preview + verifier registry check response + confirmation with note.
- `reject.screen.json` — dedicated reject flow: reason picker (invalid /
  expired / jurisdiction mismatch / fraudulent / other) + notes.

### `resources/tax-calculation/`

Read-only calculation ledger. Owner + admin + finance + support.

- `list.screen.json` — filterable calculation view with provider chip + tax
  amount + latency badge. Filters on provider, invoice_line, date range.
- `detail.screen.json` — full detail on one calculation: base fields +
  tax_rate_snapshot + exemption_applied + provider_metadata + linked
  invoice_line.

### `resources/tax-provider/`

Provider config CRUD. Owner + admin.

- `list.screen.json` — active provider grid with status chip + circuit-breaker
  badge + last-success indicator + jurisdictions covered.
- `create.screen.json` — multi-step wizard: provider picker → credentials form
  (per-provider schema) → jurisdictions picker → confirm.
- `edit.screen.json` — same fields as create, minus provider slug (immutable).
- `test.screen.json` — send a synthetic test calculation; live-updates with
  result + latency + error details.

### `resources/tax-report/`

Reporting surface. Enterprise + Medium tiers.

- `annual.screen.json` — annual tax summary dashboard: filter by year +
  jurisdiction + provider. Revenue-attribution grid + per-jurisdiction
  breakdown + regulator export (PDF / CSV / JSON).

### `widgets/`

- `rate-badge.widget.json` — colour-coded chip for tax rates (percentage
  displayed + active/expired indicator).
- `jurisdiction-picker.widget.json` — country + state autocomplete backed by
  the ISO 3166 catalog + custom jurisdictions.
- `exemption-status-chip.widget.json` — colour-coded chip for verification
  status (pending yellow / verified green / rejected red / expired grey).
