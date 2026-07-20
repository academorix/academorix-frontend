# region

Commercial + regulatory zone belonging to a Tenant. Owns `Region` — the row that
answers "what currency, tax rules, timezone, and locale apply here?". Wave 2a of
the platform tier (priority 40).

## 1. What this module owns

| Concern                            | Owned artefact                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Commercial + regulatory zone       | `Region` (`regions.tenant_id`) — currency + timezone + locale + tax_config + weekend_days                   |
| Country-defaults reference table   | `data/country-defaults.json` — 40+ countries mapped to their default { currency, tz, locale, tax, weekend } |
| Auto-provisioning                  | `SeedDefaultRegionForTenantJob` — dispatched on tenancy::TenantProvisioned                                  |
| Default-region invariant           | Exactly one `is_default=true` Region per tenant, enforced by observer + reconciler                          |
| Tenant surface                     | Full CRUD on `/api/v1/regions` + lifecycle actions (`set-default`, `pause`, `resume`, `archive`)            |
| Platform-admin surface             | Cross-tenant read (`/api/v1/platform/regions`) + the country-defaults reference table                       |
| `BelongsToRegion` trait            | For Branch, Finance::Membership, Invoice, Transaction — the domain rows that anchor to a Region             |
| `region.resolve_active` middleware | Resolves the caller's active region from `X-Region-Id` or the tenant default                                |
| Entitlement gates                  | `region_slot` (Small=1, Medium=3, Enterprise=∞), `region_custom_tax_rules`, `region_time_travel`            |
| Tax config confidentiality         | `tax_config.registration_number` redacted unless `regions.view.tax_registration`                            |

### 1.1 Region is orthogonal to Organization

Region and Organization are two **independent** axes below Tenant:

- **Region** — commercial + regulatory. Answers "what currency, tax, timezone,
  locale?". A tenant running one brand in three countries has one Organization
  - three Regions.
- **Organization** — structural + brand. Answers "which brand does this belong
  to?". A tenant running two brands in one country has two Organizations + one
  Region.

They **meet at Branch**. Every Branch carries both `region_id` (required) AND
`organization_id` (required). Region has NO FK to Organization; Organization has
NO FK to Region. Any migration that adds `region_id` to `organizations` or
`organization_id` to `regions` is a schema violation caught by the
tenancy-compliance-auditor per `tenancy-columns.md` §5.

### 1.2 Every tenant gets a default region on TenantProvisioned

Downstream code (Branch, Finance, Subscription pricing) assumes at least one
Region exists per tenant. The `SeedDefaultRegionOnTenantProvisioned` listener

- hook dispatch `SeedDefaultRegionForTenantJob` which resolves the tenant's
  registered country → `data/country-defaults.json` → creates the row with
  `is_default=true`. Silent (no `RegionCreatedNotification`) because the default
  region is a system invariant, not a tenant purchase.

## 2. The row-level attribution contract

Region carries `tenant_id` ONLY. Per `.kiro/steering/tenancy-columns.md` §3:

- ✅ `regions.tenant_id` — required, FK to `tenants.id`, `onDelete=cascade`
- ❌ `regions.application_id` — FORBIDDEN. Application cascades through
  `tenants.application_id` (regions are NOT one of the 8 rows in §2 that carry
  `application_id` directly).
- ❌ `regions.organization_id` — FORBIDDEN. Regions and Organizations are
  orthogonal.
- ❌ `regions.scope_node_id` — FORBIDDEN. Regions are not a scope consumer; they
  are entities referenced BY scope nodes via the `entity_id` reverse lookup.
- ❌ `regions.parent_id` — FORBIDDEN. Regions are flat per tenant.
  Sub-jurisdictions use the `subdivision_code` column (ISO 3166-2).

Cross-tenant FKs from Region to any other aggregate are forbidden.

## 3. Tier boundaries

Per `hierarchy.md` §7 tier matrix:

| Tier       | Max Regions | Multi-rate tax | Retroactive edits    |
| ---------- | ----------- | -------------- | -------------------- |
| Small      | 1 (default) | ❌             | ❌                   |
| Medium     | 3           | ❌             | ❌                   |
| Enterprise | unlimited   | ✅             | ✅ (per-tenant gate) |

Backed by three entitlements:

- **`region_slot`** — the quantity cap. Consumed on create. Refuses further
  creates with `RegionQuotaExceeded` (402) once exhausted. The default region
  does NOT consume a slot — it's a system invariant.
- **`region_custom_tax_rules`** — enables `tax_config.rates[]` (multi-rate).
  Enterprise-only.
- **`region_time_travel`** — enables retroactive tax_config replay against
  historical Invoices. Enterprise-only + off by default even for Enterprise
  (per-tenant activation gate + compliance letter required).

Downgrading (Medium → Small) does NOT auto-archive extra Regions. The
entitlement reconciler surfaces the drift + suggests a manual archive path.

## 4. The country-defaults data pipeline

`RegionProvisioner` accepts a partial input — the caller may supply just
`{ country_code: 'AE' }` and receive AED + Asia/Dubai + ar-AE + [friday,
saturday] + VAT 5% auto-filled from `data/country-defaults.json`. Every field
the caller explicitly supplies overrides its default.

The defaults table ships 40+ countries covering the expected launch markets:
`US, GB, IE, AE, SA, KW, QA, OM, BH, JO, EG, MA, TN, DZ, LB, PK, IN, MY, SG, ID, TH, PH, AU, NZ, CA, MX, BR, DE, FR, ES, IT, NL, SE, NO, DK, FI, TR, ZA, KE, NG`.

Countries not in the table are refused by default (per
`region.validation.reject_unknown_country_code`). Turn the config off for
supranational zones (EU) or markets we haven't shipped defaults for; the caller
then supplies every field explicitly.

## 5. Lifecycle timeline

```
[created]  status=active + is_default (usually) OR default=false
    ↓
[paused]   status=paused — new bookings + memberships refused
    ↓ (resume)
[active]   full access
    ↓ (archive)
[archived] soft-deleted (deleted_at set); hidden from selectors
    ↓ (restore within 730 days)
[active]
    ↓ (retention expires; PurgeArchivedRegionsJob runs)
[hard-deleted]  fires RegionDeleted { mode: 'hard' }
                audit row survives 7 years (financial retention)
```

Two guardrails:

- **`is_default=true` cannot be deleted / archived / paused.** The caller must
  promote another Region first. Every guard is `409` with a specific error code
  (`CANNOT_DELETE_DEFAULT_REGION`, `CANNOT_ARCHIVE_DEFAULT_REGION`,
  `CANNOT_PAUSE_DEFAULT_REGION`).
- **Regions in use cannot be archived / deleted.** Any inbound row (Branch,
  Membership, Invoice, Transaction) referencing the Region blocks the write with
  `REGION_IN_USE` (409). The FK RESTRICT is the DB fallback; the observer
  surfaces the clearer error.

## 6. Tax configuration

The `tax_config` JSONB blob:

```json
{
  "default_rate_percent": 5.0,
  "name": "VAT",
  "inclusive": false,
  "rates": [
    { "category": "youth_programme", "rate_percent": 0.0, "notes": "..." }
  ],
  "registration_number": "TRN-100234567890003"
}
```

- **`default_rate_percent`** — the default rate applied to any line item. Every
  tier gets this.
- **`name`** — display name ("VAT", "Sales Tax", "GST"). Every tier.
- **`inclusive`** — true when list prices include tax; false when tax is added
  at checkout. Every tier.
- **`rates[]`** — multi-rate for jurisdictions with different rates per
  category. Enterprise-only via `region_custom_tax_rules` entitlement.
- **`registration_number`** — the tenant's tax registration ID for this
  jurisdiction. Confidential-tier — redacted unless the caller carries
  `regions.view.tax_registration`.

### 6.1 Historical integrity

Tax config changes NEVER retroactively repricing existing Invoices. Historical
Invoices carry a snapshot of the tax_config that applied at issuance (finance
module Wave 4 will carry the snapshot column). The `region_time_travel`
entitlement (Enterprise-only + off by default) is the ONLY path to retroactive
edits + is fully audit-logged.

## 7. What this module does NOT do

- **Doesn't own physical venues.** Branches are in the `branch` module (Wave
  2b). Facilities cascade through Branch.
- **Doesn't own memberships.** `Finance::Membership` (Wave 4) carries the
  `BelongsToRegion` trait; the region module doesn't know about memberships.
- **Doesn't calculate taxes.** `TaxConfigResolver` (this module) resolves the
  applicable rate; the actual tax line-item math lives in the finance module.
- **Doesn't manage currencies platform-wide.** ISO 4217 is universal; there's no
  `currencies` table. If a future feature needs FX rates, that lives in a
  separate `fx` module.
- **Doesn't sync to Avalara / TaxJar.** Automated tax-rate lookups are out of
  scope for Wave 2a. If added, a new subprocessor will be documented.
- **Doesn't clone regions.** Each tenant creates their own. Cross-tenant cloning
  is forbidden.
- **Doesn't nest.** Regions are flat per tenant. Sub-jurisdictions live on the
  same row via `subdivision_code`.
- **Doesn't auto-detect region from IP.** Privacy concern + often wrong. The
  X-Region-Id header or the tenant default is the only resolution path.

## 8. Wave 2a scope boundaries

The tenant module fires `TenantProvisioned` — this module's listener seeds the
default region for NEW tenants going forward. Existing tenants at deploy time
are handled by the one-shot `region:seed-defaults-for-legacy-tenants` command
that iterates every region-less tenant + dispatches
`SeedDefaultRegionForTenantJob` for each. Idempotent — safe to re-run.

## 9. Cross-references

- `.kiro/steering/hierarchy.md` §2 — the platform tree (Region is one of the
  three orthogonal axes below Tenant)
- `.kiro/steering/hierarchy.md` §7 — tier matrix (region slots per tier)
- `.kiro/steering/hierarchy.md` §13 — non-goals (cross-tenant Region is
  forbidden; region has no application_id shortcut)
- `.kiro/steering/tenancy-columns.md` §3 — the tenant_id mandate (Region carries
  tenant_id only)
- `.kiro/steering/tenancy-columns.md` §5 — forbidden columns (region_id on
  organizations, organization_id on regions)
- `modules/shared/blueprints/localization/` — the sibling `Language` reference
  that this module leans on for locale validation
- `modules/platform/blueprints/tenancy/` — the parent Tenant module firing
  `TenantProvisioned`
- `modules/platform/README.md` — module tier index
