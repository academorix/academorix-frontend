# ADR 0027 — Row-level attribution: the three-axes column contract

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Data lead + Backend
architecture

## Context

Every persisted row in the platform answers zero, one, two, or three independent
attribution questions:

1. **Which tenant owns this row?** — the standard multi-tenancy question.
2. **Which of the N Stackra products (Applications) does it belong to?** —
   Sports vs Marketplace vs future verticals.
3. **What cascading-resolution path does it participate in?** — the configurable
   per-tenant hierarchy that drives settings, feature flags, permission
   overlays.

The pre-2026 schema conflated these three concerns into a single `tenant_id` FK
column on every row, plus ad-hoc shortcuts:

- `region_id` on `organizations` (regions cascade through Tenant, not through
  Org; the shortcut was wrong).
- `organization_id` on `facilities` (facilities cascade through Branch; the
  shortcut was wrong).
- `application_id` on every row below Tenant (application cascades through
  `tenants.application_id`; the shortcut was 90+ rows deep and drift-prone).
- `scope_node_id` sprinkled on domain rows (scope is a configuration substrate;
  domain rows are NOT configuration consumers).

The cost of the conflation:

- **Queries** joined through the wrong shortcut and produced cross-tenant leaks.
- **Migrations** shipped the same column on 90+ tables; renaming or adding an
  index was a 90-file PR.
- **Reviewers** couldn't answer "which axis owns this row?" without reading
  three files.
- **The tenancy-compliance-auditor agent** (added mid-2026) reported compliance
  violations at 15% of the tenant-scoped model surface.

## Options considered

1. **Add `tenant_id` + `application_id` + `scope_node_id` to every row
   (reject).** Denormalisation everywhere; every DB migration ships three
   columns; the schema doubles in width. Cross-tenant query performance degrades
   because none of the columns are the natural join key on 80% of queries.

2. **One `attribution_id` column pointing at a normalized `attributions` row
   (reject).** Every join adds an extra hop. Multi-tenant global scopes have to
   walk through the attribution table to reach `tenant_id`.

3. **Three orthogonal columns; each row carries only the ones it needs
   (chosen).** `tenant_id` on every domain row below Tenant. `application_id` on
   ONLY the 8 rows that need it. `scope_node_id` on ONLY configuration
   consumers. The three columns answer three different questions; a row that
   doesn't ask a question doesn't carry the column.

## Decision

### D1 — Three axes, three columns

| Axis            | Column           | Question answered                                            | Which rows carry it                                                                                                                           |
| --------------- | ---------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**      | `tenant_id`      | Which tenant owns this row?                                  | Every domain row below Tenant. `BelongsToTenant` trait auto-fills + applies global scope.                                                     |
| **Application** | `application_id` | Which Stackra product does this row belong to?               | The 8 rows named in D2. Everything else cascades through `tenants.application_id`.                                                            |
| **Scope**       | `scope_node_id`  | What cascading-resolution path does this row participate in? | Configuration consumers ONLY (settings, feature flags, permission overlay, pricing overrides, notification prefs). NEVER on domain data rows. |

If you can't state the question your column answers in one sentence from that
table, you're using the wrong axis.

### D2 — The 8-row `application_id` mandate

**Only these 8 row types carry `application_id` directly.** Every other row
cascades through `tenant_id → tenants.application_id`.

| Row                    | Column                                              | Notes                                             |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------- |
| `tenants`              | required                                            | Composite unique `(application_id, slug)`.        |
| `users`                | required (post-split)                               | Composite unique `(identity_id, application_id)`. |
| `roles`                | nullable                                            | Null = `platform_admin` guard scope.              |
| `permissions`          | nullable                                            | Null = `platform_admin` guard scope.              |
| `tenant_subscriptions` | required                                            | Scoped by `(application_id, tenant_id)`.          |
| `entitlement_licenses` | required                                            | Scoped by `(application_id, tenant_id)`.          |
| `audits`               | required for tenant-audience; nullable for platform | Vendor table (owen-it/laravel-auditing).          |
| `activity_log`         | required for tenant-audience; nullable for platform | Vendor table (spatie/laravel-activitylog).        |

Adding `application_id` to Branch, Team, Organization, Facility, Region,
Profile, or any AI/Auth/Access domain row is a schema violation.

Extension for central-plane infrastructure rows (plans, auth_jwt_signing_keys,
service_accounts, domains) is codified in ADR-0031 as a scoped exception. It
does NOT open the 8-row mandate to domain rows.

### D3 — The `tenant_id` mandate

Every domain row below Tenant carries `tenant_id`. Every model that composes
`Stackra\Tenancy\Concerns\BelongsToTenant` inherits the global scope + the
on-save fill + the FK registration.

`BelongsToTenant` MUST come first in the trait composition order — subsequent
traits observe the tenant context in their `booted()` hooks. See
`.kiro/steering/hierarchy.md` §14.

Vendor tables that ship without `tenant_id` (audits, activity_log) get a
compliance migration that adds `tenant_id UUID NULL` +
`INDEX(tenant_id, created_at)` + the trait on the module's wrapper model. See
`.kiro/steering/tenancy-columns.md` §3 for the two known gaps.

### D4 — Scope is for configuration consumers ONLY

`scope_node_id` is NOT a general-purpose tenancy column. It exists for cascading
value resolution across a per-tenant configurable hierarchy. Only these packages
integrate with scope:

- **`scope`** — owner (provides `ScopeNode`, `ScopeValue`, `#[ScopedTo]`,
  `ResolveScope` middleware).
- **`settings`** — consumer.
- **Access permissions overlay** — consumer (planned).
- **Entitlements feature flags + quotas** — consumer (planned).
- **Subscription per-node pricing overrides** — consumer (planned).
- **Notifications per-user / per-branch prefs** — consumer (planned).

Every other package is NOT a scope consumer. Adding `scope_node_id` to a domain
data row (Team, Athlete, Branch, Facility) is a compliance failure.

### D5 — Forbidden columns

The following columns MUST NEVER exist. Each shortcut is banned because the
correct path already exists:

| Forbidden               | On                                                     | Correct path                                           |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `application_id`        | Any row below Tenant except the 8 in D2                | Join through `tenants` when needed                     |
| `region_id`             | `organizations`                                        | They meet at Branch                                    |
| `organization_id`       | `facilities`, `regions`                                | Cascade through Branch or belong to Tenant             |
| `scope_node_id`         | Any tenant-scoped domain row not in D4's consumer list | Use `tenant_id`                                        |
| Any FK crossing tenants | Everywhere below the platform plane                    | Per-tenant materialised views for cross-tenant rollups |
| Cross-guard role rows   | `roles`, `permissions`                                 | `sanctum` and `platform_admin` never mix               |
| Cross-app role rows     | `roles`, `permissions`                                 | Sports role never applies to Marketplace               |

### D6 — Enforcement is layered

Compliance is layered — every layer catches what the layer above missed:

1. **Migration review** — reject new migrations that add `application_id`
   outside D2 or forbidden columns from D5.
2. **`BelongsToTenant` trait** — auto-fills + applies global scope.
3. **`ApplicationMismatch` / `GuardMismatch` (422)** — write-path guards.
4. **`ResolveApplication` middleware** — rejects tenant-audience requests
   missing `X-Application-Id`.
5. **`tenancy-compliance-auditor` agent** — the on-demand scanner (see
   `.kiro/agents/`) that walks a package against every rule in this ADR.

## Consequences

**Positive:**

- **Every column answers one question.** Reviewers read the row and know which
  axis it participates in.
- **Cascades are explicit.** Application cascades through Tenant. Region +
  Organization meet at Branch. Facility cascades through Branch. Every join key
  is the natural key.
- **Compliance is auditable.** The `tenancy-compliance-auditor` agent grep-scans
  every package against this ADR + returns a structured report.
- **Cross-tenant leaks become impossible at the DB layer.** `BelongsToTenant`'s
  global scope filters every query.

**Negative:**

- **Adding `application_id` to a new row requires an ADR.** D2's 8-row list is
  locked; extending it (ADR-0031 for central-plane infrastructure) is
  deliberate. The friction is by design.
- **Vendor migrations** that add `tenant_id` to third-party tables (owen-it
  audits, spatie activity_log) require a follow-up backfill from
  `new_values.tenant_id` / `properties.tenant_id` JSON columns.
- **The three-axes rule needs training.** Every new backend developer learns the
  three columns + when to use each. Mitigated by the auditor agent flagging
  violations at PR time.

**Neutral:**

- **This ADR is the CODIFICATION of a rule that steering already documented.**
  `.kiro/steering/tenancy-columns.md` §1-5 was the operational document; this
  ADR anchors those rules with an explicit Context + Options + Consequences
  narrative.

## Related work

- `.kiro/steering/tenancy-columns.md` — the day-to-day rules this ADR anchors.
  §§1-5 are the enforceable surface; §§6-9 are the operational tail (enforcement
  points, auditor agent, migration templates, living gap register).
- `.kiro/steering/hierarchy.md` — the platform tree that carries these columns.
- `.kiro/agents/tenancy-compliance-auditor.md` — the agent that scans packages
  against this ADR.
- ADR-0031 — `application_id` extension for central-plane infrastructure rows.
- ADR-0022 — Language-agnostic service boundary (the `tenant_id` claim in Seam 2
  JWTs derives from this ADR).
