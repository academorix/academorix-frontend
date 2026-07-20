# region — changelog

## [Unreleased] — inception (Wave 2a of the platform tier)

- Region module authored. One entity: `Region` (tenant-scoped, no
  `application_id`, no `organization_id`, no `scope_node_id`).
- Country-defaults reference table shipped at `data/country-defaults.json`
  covering 40 launch markets (Americas, EMEA, GCC, South Asia, SEA, ANZ,
  Africa).
- Auto-provisioning: `SeedDefaultRegionOnTenantProvisioned` listener + hook
  dispatch `SeedDefaultRegionForTenantJob` on `tenancy::TenantProvisioned`. The
  seeded default consumes NO `region_slot` entitlement — it's a system
  invariant.
- Tenant-facing CRUD at `/api/v1/regions` — GET / POST / GET one / PATCH /
  DELETE + lifecycle actions (`set-default`, `pause`, `resume`, `archive`,
  `restore`) + tax-config detail (`GET /{region}/tax-config`,
  `PATCH /{region}/ tax-config`).
- Platform-admin surface at `/api/v1/platform/regions` for cross-tenant read +
  `/api/v1/platform/country-defaults` exposing the shipped reference table.
- `BelongsToRegion` trait for downstream models (Branch Wave 2b, Finance::
  Membership Wave 4, Invoice, Transaction). Adds the `region()` belongsTo
  relation + a `resolveInRegion()` query scope + a `booted()` hook that
  auto-fills `region_id` from the active-region middleware slot.
- `region.resolve_active` middleware resolves the caller's active region from
  the `X-Region-Id` header OR the tenant's default. Rejects cross-tenant header
  attempts with `REGION_CROSS_TENANT` (403, warn-severity audit).
- Default-region invariant: exactly one `is_default=true` Region per tenant.
  Observer enforces on write; `ReconcileDefaultRegionInvariantJob` (nightly)
  catches drift + optionally auto-heals per config.
- Immutability guards: `country_code` and `currency` are immutable once any
  inbound row references the Region (`COUNTRY_CODE_IMMUTABLE`,
  `CURRENCY_IMMUTABLE`). Config-flag bypass for currency
  (`region.validation.allow_currency_immutable_bypass`) requires ops sign-off —
  it invalidates historical financial reconciliation.
- Tax configuration: JSONB `tax_config` blob on the Region row with sub-fields
  `default_rate_percent`, `name`, `inclusive`, `rates[]`, `registration_number`,
  `fiscal_year_start_month`. Multi-rate `rates[]` gated by the
  `region_custom_tax_rules` entitlement (Enterprise-only). Retroactive edits
  gated by `region_time_travel` (Enterprise-only + off by default).
- Tax-registration confidentiality: `tax_config.registration_number` is
  `confidential`-tier. Redactor strips it on egress unless the caller carries
  `regions.view.tax_registration`. NEVER a Segment analytics property. NEVER in
  webhook payloads.
- Entitlements published: `region_slot` (Small=1, Medium=3, Enterprise=∞),
  `region_custom_tax_rules`, `region_time_travel`.
- Feature keys published: `region.core`, `region.multiple`,
  `region.custom_tax_rules`, `region.pause_resume`, `region.archive_restore`,
  `region.time_travel`, `region.tax_registration`.
- Twelve lifecycle events: `RegionCreated`, `RegionUpdated`,
  `RegionStatusChanged`, `RegionPaused`, `RegionResumed`, `RegionArchived`,
  `RegionRestored`, `RegionDefaultChanged`, `RegionTaxConfigUpdated`,
  `RegionDeleted`, `TenantDefaultRegionSeeded`. Every event implements
  `ShouldDispatchAfterCommit`.
- Notifications: `RegionCreatedNotification`, `RegionPausedNotification`
  (cannot-opt-out — new-booking block is ops-critical),
  `RegionDefaultChangedNotification` (cannot-opt-out — financial calculation
  impact).
- Retention: 730-day archived retention (2 years — financial floor). Enterprise
  tenants may extend up to 2555 days (7 years — matching audit-row retention).
- Audit-log rows produced by this module retained 7 years per financial-record
  compliance floor (outlives their source Region on hard-delete).
- Analytics: 9 Segment `track` events. `region_id` (ULID) is anonymised;
  `tax_config.registration_number` NEVER a property. `rate_delta` numeric-only
  in `Region Tax Config Updated`.
- Health probes: 8 total covering table migration, country-defaults load, FK
  integrity, default-region invariant, slug uniqueness, tax_config JSON shape,
  purge queue drain, inbound FK drift.
- ULID prefix reserved: `reg_` (Region). Foundation registry updated in the same
  commit.
- Two tenancy hooks: `SeedDefaultRegionOnTenantProvisioned` +
  `PreventRegionOrphansOnTenantErased` so the tenant → region relationship
  survives tenant lifecycle transitions cleanly.
- One-shot deploy-time command: `region:seed-defaults-for-legacy-tenants`
  iterates every pre-existing tenant + dispatches
  `SeedDefaultRegionForTenantJob` for each. Idempotent.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `entitlements`.
- Extended by `branch` (Wave 2b — every Branch carries `region_id`).
- Planned consumers: `branch`, `facility`, `subscription`, `finance`
  (Membership, Invoice, Transaction, tax calculation), `notifications`, `audit`,
  `activity`.
- Ships alongside the platform infrastructure — required for Branch (Wave 2b)
  and everything below.

### Non-goals for this release

Every non-goal below stays out of this module. See `readme.md` §7 for the full
list.

- No cross-tenant regions.
- No `application_id` on regions.
- No `organization_id` on regions.
- No `region_id` on organizations.
- No region cloning.
- No nested regions.
- No auto-detect from IP.
- No historical tax-rate versioning in-column (finance module Wave 4 carries the
  per-invoice snapshot).
- No automated tax-rate lookups (Avalara / TaxJar) — deferred beyond Wave 2a.
