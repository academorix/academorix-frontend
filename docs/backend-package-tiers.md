# Backend Package Tiers

Four-tier taxonomy that classifies every backend package. Consumed by
`catalog.json` (`tier` field) and the `stackra new` CLI when it filters
packages by capability.

**Rationale:** the physical directory layout under `packages/backend/**` is
already organized by domain bucket (`framework/`, `access/`, `finance/`,
`sports/`, …), so the tier field is metadata — not a filesystem move. Renaming
top-level directories to `foundation-tier/`, `framework-tier/`, etc. was
considered (Option B) and rejected because it would break every composer path
repository and PSR-4 autoload; Option A (metadata-only) delivers the same
grouping at query time without the migration cost.

**Physical restructuring is deferred.** If the tier metadata proves insufficient
for tooling (unlikely), revisit with a full path-repository sweep.

---

## Tier 1 — Foundation (2 packages)

Every Stackra app boots against these. Zero business logic. Zero SaaS-shape
opinion. Zero domain flavour. Both are runtime kernels.

- `packages/backend/foundation/` — `stackra/foundation`
- `packages/backend/shared/foundation/` — `stackra-shared/foundation`

---

## Tier 2 — Framework (24 packages)

Any Laravel app of any shape can pull these. They don't presume SaaS, tenancy,
or a domain. They provide framework infrastructure: caching, events, routing,
serialization, telemetry substrate, developer-time tooling.

### `packages/backend/framework/*` (17 packages)

`caching`, `console`, `container`, `crud`, `database`, `enum`, `events`,
`exceptions`, `feature-flags`, `omniterm`, `routing`, `scheduling`, `scope`,
`serializer`, `service-provider`, `settings`, `support`

### `packages/backend/telemetry/*` (5 packages)

`debug-bar`, `health`, `horizon`, `nightwatch`, `sentry`

### Cross-cutting framework (2 packages)

- `packages/backend/authorization/` — attribute-driven controller authorization.
  Framework tier because it's a permission substrate (the primitive the SaaS
  `access/*` layer sits on), not a customer-facing product.
- `packages/backend/compliance/architecture/` — ADR-rule linter, developer
  tooling. Framework tier because it enforces architecture at CI time; not a
  SaaS feature.

---

## Tier 3 — SaaS primitives (82 packages)

Every SaaS platform needs these regardless of vertical (sports, salon, gym,
clinic, edu). They implement multi-tenancy, identity, billing, notifications,
observability, and the plumbing around them. Vertical-agnostic.

### `packages/backend/access/*` (5 packages)

`delegation`, `grants`, `invitations`, `rbac`, `requests`

### `packages/backend/billing/*` (2 packages)

`entitlements`, `subscription`

### `packages/backend/compliance/*` (2 packages)

`compliance`, `retention`

`compliance/architecture` is Tier 2 — see above.

### `apps/stackra/src/modules/finance/*` (14 packages, skipping domain-shape)

**Moved out of Stackra base.** Every finance module is now under the Stackra
app tree. Reason: the whole payments surface (chargeback → wallet) is
`parent-pays-academy`, which is Stackra product domain, not Stackra framework
primitives.

**In-scope:** `chargeback`, `coupon`, `dunning`, `expenses`, `gateway`,
`invoice`, `marketplace-fee`, `order`, `payment`, `payout`, `refund`, `tax`,
`transaction`, `wallet`

**Also under `apps/stackra/src/modules/finance/`:** `membership`,
`digital-passes` — these are sport/product-specific (Tier 4 shape below).

### `packages/backend/notifications/*` (8 packages)

`announcements`, `messaging`, `newsletter`, `notifications`,
`notifications-in-app`, `notifications-mail`, `notifications-push`,
`notifications-sms`

### `packages/backend/observability/*` (3 packages)

`activity`, `audit`, `monitoring`

### `packages/backend/shared/*` (10 packages, `foundation` is Tier 1)

`activity`, `attributes`, `audit`, `geography`, `localization`, `offline-sync`,
`search`, `telemetry`, `transfer`, `versioning`

### `packages/backend/identity/*` (7 packages)

`auth`, `identity`, `mfa`, `people`, `platform-user`, `service-accounts`, `user`

### `apps/stackra/src/modules/growth/*` (5 packages)

**Moved out of Stackra base.** Marketing / attribution / referral surface is
Stackra product domain.

`analytics`, `attribution`, `leads`, `marketing`, `referrals`

### `packages/backend/platform/*` (18 packages, skipping business-shape)

**In-scope:** `admin-console`, `ai`, `application`, `branding`, `credentials`,
`domains`, `forms`, `integrations`, `organization`, `public-site`, `realtime`,
`region`, `reporting`, `staff`, `storage`, `tenancy`, `theme`, `webhook`

**Skipped (Tier 4):** `branch`, `facility`, `reception`, `safeguarding`, `teams`
— these are physical/venue-specific and vertical-shaped.

### `packages/backend/sdk/*` (8 packages)

`access-sdk`, `api-sdk`, `billing-sdk`, `compliance-sdk`, `identity-sdk`,
`notifications-sdk`, `platform-application-sdk`, `platform-sdk`

---

## Tier 4 — Domain (SKIPPED, 31 packages)

Sport-specific / product-specific / vertical-specific. **No `catalog.json` in
Tier 4** — the classification is documented here + a bucket-level README
explains the deferral for each Tier-4 top-level dir. Individual package READMEs
remain authoritative for their domain.

### Sports vertical (21 packages)

`apps/stackra/src/modules/sports/*` (moved out of `packages/backend/` — pure
Stackra domain).

### Products (1 package)

`apps/stackra/src/modules/products/*` (moved out of `packages/backend/` —
`geofencing` currently, product-specific).

### Workflow (2 packages)

`packages/backend/workflow/*`

### Business-shape platform (5 packages)

- `packages/backend/platform/branch`
- `packages/backend/platform/facility`
- `packages/backend/platform/reception`
- `packages/backend/platform/safeguarding`
- `packages/backend/platform/teams`

### Domain-shape finance (2 packages)

- `apps/stackra/src/modules/finance/membership`
- `apps/stackra/src/modules/finance/digital-passes`

---

## Boundary calls (recorded for future review)

Six placements below could reasonably go either way. This section documents the
rationale for the current call — reopen if evidence changes.

1. **`authorization/authorization` → Framework.** It's a permission substrate,
   not a customer-facing product. The customer-facing product is `access/*`
   (Tier 3), which sits ON TOP of this. If a Laravel app wants attribute-driven
   controller gating without the SaaS RBAC baggage, it pulls only this.

2. **`compliance/architecture` → Framework.** It's an ADR-rule linter (developer
   tooling), not a customer-facing GDPR/PDPL product. The customer-facing
   compliance flows live in `compliance/compliance` (Tier 3).

3. **`compliance/compliance` → SaaS.** Customer-facing GDPR/PDPL flows, DSR/DSAR
   handling, retention orchestration. A tenant admin operates it.

4. **`platform/*` (18 kept) → SaaS.** Tenancy, region, admin-console, etc. are
   opinions about how a multi-tenant SaaS is shaped. They don't belong at the
   framework layer (a non-SaaS Laravel app wouldn't want them) and they aren't
   vertical-shaped (every SaaS needs them regardless of what the SaaS sells).

5. **`growth/*` → SaaS.** Analytics + attribution + marketing are cross-vertical
   SaaS mechanics — every SaaS needs to measure funnels. Not framework (too
   opinionated on the tenant model), not domain (not sport-specific).

6. **`sdk/*` → SaaS.** These are client libraries that wrap cross-cutting SaaS
   APIs. They ship the wire vocabulary for the SaaS-tier services. Framework
   tier is wrong because the SDK contract is SaaS-shaped (tenant-scoped
   endpoints, RBAC-aware).

---

## Frontend catalog scope (42 packages)

Frontend packages under `packages/frontend/*` follow a parallel three-group
split. All are Tier 3 (`saas`) with `kind: framework-plumbing` unless noted.

### Group A — Framework core (22 packages)

Non-UI packages that ship `core` surface (some also `react`, `native`,
`testing`):

`cache`, `config`, `container`, `contracts`, `coordinator`, `csp`, `decorators`,
`events`, `http`, `logger`, `monitoring`, `network`, `pipeline`, `query`,
`queue`, `realtime`, `scope`, `state`, `storage`, `support`, `sync`, `testing`

### Group B — Services (5 packages)

Provide app-level runtime services:

`analytics`, `console`, `notifications`, `scheduler`, `vite`

### Group C — Web UI + feature packages (present in workspace)

Include `react` surface (some also `native`):

`actions`, `ai`, `collaboration`, `consent`, `dashboard`, `devtools`, `error`,
`frontend`, `i18n`, `kbd`, `pwa`, `routing`, `sdui`, `settings`, `theming`, `ui`

**Notes:**

- `frontend` is a special internal package (may itself be a manifest/registry).
- 42 packages total present today. Six packages from the roadmap
  (access-control, approvals, auth, identity, invitations, navigation) are NOT
  yet in the tree and will get their `catalog.json` when the code lands.

---

## Verification

```sh
# Backend catalog counts (Tier 1+2+3 that stayed under packages/backend/**)
find packages/backend -name catalog.json 2>/dev/null | wc -l
# → 89 expected

# Frontend catalog counts
find packages/frontend -name catalog.json 2>/dev/null | wc -l
# → 43 expected

# Total
find packages -name catalog.json 2>/dev/null | wc -l
# → 132 expected

# Every catalog.json validates against the v1 schema
python3 scripts/add-catalog-schema.py --dry-run --quiet
# → 132 skipped (all already carry $schema)
```

## Note on migration state

The 14 `finance/*`, 5 `growth/*`, 21 `sports/*`, and 1 `products/*` packages
that used to live under `packages/backend/` moved to
`apps/stackra/src/modules/` (commit `6eb4096df` — 2026-07-XX). They are
Tier 4 (domain/vertical) and correctly SKIPPED per this taxonomy — no
`catalog.json` is authored for them regardless of location. If the vertical
packages ever come back into the SaaS-primitive slot, this doc plus their
`catalog.json` files can be regenerated in one pass.

---

## Source of truth

- Physical inventory: `packages/backend/**` + `packages/frontend/**` on disk
- Tier field: this document
- Field shape: `.kiro/specs/utils-work/catalog-tasks.md`
- Schema:
  `https://gist.githubusercontent.com/stackra-user/073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json`
