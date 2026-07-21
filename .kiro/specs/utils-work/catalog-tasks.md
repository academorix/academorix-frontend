# Catalog Tasks

Publish the catalog JSON Schema (via GitHub gist), write the tier taxonomy doc,
and populate `catalog.json` for every workspace package that ships one. 156
catalog files + 1 schema + 1 taxonomy doc + 1 Python script.

**File-tree ownership**:

- `.ref/schemas/catalog.v1.json`
- `docs/backend-package-tiers.md`
- Every `catalog.json` under `packages/backend/**` and `packages/frontend/**`
- `scripts/add-catalog-schema.py`

**Depends on**: `structure-tasks.md` — packages must live at the new paths
before this file writes into them.

**No git operations.**

---

## 1. `.ref/schemas/catalog.v1.json`

JSON Schema Draft 2020-12. Every `catalog.json` in the workspace validates
against this file.

### Top-level fields

- **`additionalProperties: false`** — critical; keeps the shape locked
- **`required`**:
  `["name", "tier", "surfaces", "purpose", "capabilities", "maturity"]`
- **`properties`** (in this order — `$schema` first so instance files match):

```
$schema           string, format: uri
name              string, pattern: ^([a-z0-9-]+/[a-z0-9-]+|@[a-z0-9-]+/[a-z0-9-]+)$
tier              enum: [foundation, framework, saas, domain]
surfaces          array<string>, items enum: [core, react, native, testing]
kind              enum: [framework-plumbing, sdk, feature, tooling]
purpose           string, maxLength: 200
capabilities      array<string>, items maxLength: 100, minItems: 1
when_to_use       string
when_not_to_use   string
peer_deps         array<string>
backend_pair      string | null
size_gzip_kb      object<string, number>
maturity          enum: [alpha, beta, stable]
owning_agent      string
docs              array<string>
```

### Description text

Include a top-level `description`: "Stackra package catalog entry (v1) —
machine-readable per-package metadata consumed by the `stackra new` CLI and
every design agent that needs to know what a package does before recommending
it."

---

## 2. Publish the schema to a GitHub gist

```sh
gh gist create .ref/schemas/catalog.v1.json --public \
  --desc "Stackra package catalog.json schema (v1) — https://github.com/stackra"
```

Then capture the raw URL (see `fullplan.md` for the pinned URL used in the
recreated workspace):

```
https://gist.githubusercontent.com/stackra-user/073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json
```

Verify the gist actually serves the schema:

```sh
curl -sSfL "https://gist.githubusercontent.com/stackra-user/073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json" -o /tmp/verify.json
python3 -c "import json ; d=json.load(open('/tmp/verify.json')) ; assert '\$schema' in d.get('properties',{}), 'must include \$schema'"
```

Note: GitHub gist raw URLs are CDN-cached for a few seconds after each edit. If
a fetch returns stale content, append `?_=$(date +%s)` to bust the cache.

---

## 3. `docs/backend-package-tiers.md`

Four-tier taxonomy. Total: 139 backend packages.

### Tier 1 — Foundation (2 packages)

Every app boots against these. Zero business logic. Zero SaaS opinion.

- `stackra/foundation` — path `packages/backend/foundation/`
- `stackra-shared/foundation` — path `packages/backend/shared/foundation/`

### Tier 2 — Framework (24 packages)

Any Laravel app pulls these. No SaaS or domain shape.

- `packages/backend/framework/*` — 17 packages: caching, console, container,
  crud, database, enum, events, exceptions, feature-flags, omniterm, routing,
  scheduling, scope, serializer, service-provider, settings, support
- `packages/backend/telemetry/*` — 5 packages: debug-bar, health, horizon,
  nightwatch, sentry
- `packages/backend/authorization/` (attribute-driven controller authorization)
- `packages/backend/compliance/architecture/` (ADR-rule linter)

### Tier 3 — SaaS primitives (82 packages)

Every SaaS needs these regardless of vertical (sports/salon/gym/clinic).

- `packages/backend/access/*` — 5: delegation, grants, invitations, rbac,
  requests
- `packages/backend/billing/*` — 2: subscription, entitlements
- `packages/backend/compliance/{compliance,retention}` — 2
- `packages/backend/finance/*` — 14 (skip `membership` + `digital-passes` which
  are Tier 4 domain-shaped): chargeback, coupon, dunning, expenses, gateway,
  invoice, marketplace-fee, order, payment, payout, refund, tax, transaction,
  wallet
- `packages/backend/notifications/*` — 8: announcements, messaging, newsletter,
  notifications, notifications-in-app, notifications-mail, notifications-push,
  notifications-sms
- `packages/backend/observability/*` — 3: activity, audit, monitoring
- `packages/backend/shared/*` (except `foundation`) — 10: activity, attributes,
  audit, geography, localization, offline-sync, search, telemetry, transfer,
  versioning
- `packages/backend/identity/*` — 7: auth, identity, mfa, people, platform-user,
  service-accounts, user
- `packages/backend/growth/*` — 5: analytics, attribution, leads, marketing,
  referrals
- `packages/backend/platform/*` (except
  `branch, facility, reception, safeguarding, teams` which are Tier 4) — 18:
  admin-console, ai, application, branding, credentials, domains, forms,
  integrations, organization, public-site, realtime, region, reporting, staff,
  storage, tenancy, theme, webhook
- `packages/backend/sdk/*` — 8: access-sdk, api-sdk, billing-sdk,
  compliance-sdk, identity-sdk, notifications-sdk, platform-application-sdk,
  platform-sdk

### Tier 4 — Domain / vertical (SKIPPED, 31 packages)

Sport-specific / product-specific — not portable across business types.

- `packages/backend/sports/*` (21 packages)
- `packages/backend/products/*` (1)
- `packages/backend/workflow/*` (2)
- `packages/backend/platform/{branch,facility,reception,safeguarding,teams}` (5)
- `packages/backend/finance/{membership,digital-passes}` (2)

**No `catalog.json` in Tier 4.** Drop a bucket README.md in each of `sports/`,
`products/`, `workflow/` explaining the deferral. Leave the 5 platform + 2
finance skips alone (their pre-existing READMEs are authoritative).

### Boundary calls (record in the doc)

Document these 6 placement decisions inline:

1. `authorization/authorization` → Framework (permission substrate, not
   customer-facing product)
2. `compliance/architecture` → Framework (ADR-rule linter, developer tooling)
3. `compliance/compliance` → SaaS (customer-facing GDPR/PDPL flows)
4. `platform/*` (18 kept) → SaaS (tenancy + region + admin-console are
   SaaS-shape opinions)
5. `growth/*` → SaaS (analytics + attribution are cross-vertical)
6. `sdk/*` → SaaS (client libraries wrapping cross-cutting SaaS APIs)

### Deferred structural move

Physical restructuring (renaming top-level dirs to `foundation-tier/`,
`framework-tier/`, etc.) is Option B — rejected for now because it breaks every
composer path repository + PSR-4 autoload. Option A (current) uses `tier` field
in `catalog.json` for logical grouping without moving files.

---

## 4. Frontend catalog scope (48 packages)

Under `packages/frontend/*`, split into three groups (all Tier 3 = `saas` with
`kind: framework-plumbing` unless otherwise noted).

### Group A — Framework core (22 packages)

Non-UI packages, `surfaces: ["core"]` (some add `react` and/or `testing`):

- cache, config, container, contracts, coordinator, csp, decorators, events,
  http, logger, monitoring, network, pipeline, query, queue, realtime, scope,
  state, storage, support, sync, testing

### Group B — Services (5 packages)

Provide app-level runtime services:

- analytics, console, notifications, scheduler, vite

### Group C — Web UI (21 packages)

Include `react` surface (some also `native`):

- access-control, actions, ai, approvals, auth, collaboration, consent,
  dashboard, devtools, error, i18n, identity, invitations, kbd, navigation, pwa,
  routing, sdui, settings, theming, ui

**Total frontend**: 22 + 5 + 21 = 48 catalog.json files.

---

## 5. `catalog.json` content specification

Every catalog.json is a JSON object with these fields, ordered exactly:

```jsonc
{
  "$schema": "https://gist.githubusercontent.com/stackra-user/073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json",
  "name": "stackra/foundation", // or @stackra/foo for frontend
  "tier": "foundation", // foundation | framework | saas
  "surfaces": ["core"], // subset of core/react/native/testing
  "kind": "framework-plumbing", // framework-plumbing | sdk | feature | tooling
  "purpose": "One-sentence purpose, max 200 chars, ends with a period.",
  "capabilities": ["capability phrase 1, max 100 chars", "capability phrase 2"],
  "when_to_use": "One-sentence guidance.",
  "when_not_to_use": "One-sentence alt referencing the sibling package.",
  "peer_deps": ["stackra/foundation", "spatie/laravel-data"],
  "backend_pair": null, // or "stackra/notifications"
  "size_gzip_kb": {}, // populated later by size pipeline
  "maturity": "alpha", // alpha for now across the board
  "owning_agent": "laravel-feature-builder",
  "docs": ["packages/backend/foundation/README.md"],
}
```

### Length + shape rules

- `purpose` ≤ 200 chars, ends with a period
- `capabilities` — 3 to 8 items, each ≤ 100 chars
- `peer_deps` — extract from the package's `composer.json` / `package.json`
  `dependencies`. Include `stackra/*` + `@stackra/*` internal deps and
  heavyweight third-party ones (spatie/*, laravel/pennant, etc.). Exclude
  `illuminate/*` (Laravel core), dev-only, and PHP itself.
- `backend_pair` — for frontend packages that mirror a backend module (e.g.
  `@stackra/notifications` pairs with `stackra/notifications`). Null when
  there's no pair.
- `owning_agent` — assign per tier:
  - Backend all tiers → `laravel-feature-builder`
  - Frontend Group A/B → `framework-core-builder`
  - Frontend Group C → `heroui-ui-builder`
- `docs` — repo-relative path to the package's README.md

---

## 6. `scripts/add-catalog-schema.py`

Idempotent script that walks every `catalog.json` under `packages/`, injects the
`$schema` field as the FIRST key, and rewrites the file preserving indentation.
Supports `--dry-run` and `--quiet`.

### Behavior

- Walk `packages/backend/**/catalog.json` and
  `packages/frontend/**/catalog.json`
- For each file:
  - Load JSON
  - If `$schema` is already first and matches `SCHEMA_URL`, skip
  - Otherwise: rebuild dict with `$schema` as first entry, other keys preserved
    in original order
  - Detect indent (2 or 4 space) from original raw content; default 2
  - Detect trailing newline; preserve
  - Write back atomically
- Print `updated` / `skipped` counts at the end
- Non-zero exit on JSON parse error or write failure

### Signature

```python
SCHEMA_URL = 'https://gist.githubusercontent.com/stackra-user/073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json'

# python3 scripts/add-catalog-schema.py [--dry-run] [--quiet]
```

### Docblock

Top-of-file module docblock explains: purpose, invocation, idempotency
guarantee, exit codes (0=success with counts, 1=error).

---

## 7. Execution sequence

The workflow to reproduce the state described in `fullplan.md`:

```
1. Write .ref/schemas/catalog.v1.json      (§1)
2. gh gist create ...                       (§2)
3. Write docs/backend-package-tiers.md      (§3)
4. Author 156 catalog.json files            (§5)
   • 108 backend (see §3)
   • 48 frontend (see §4)
5. Write scripts/add-catalog-schema.py      (§6)
6. Run: python3 scripts/add-catalog-schema.py
   → all 156 files now start with $schema
```

Do NOT invert steps 4 and 5 — the initial 156 files can OMIT `$schema`; the
script injects it in one pass.

### Recommended parallelization

Author the 156 catalog.json in FOUR passes (all can run in parallel after step
3):

- **Pass A (Tier 1+2, 26 files)** — Foundation + Framework
- **Pass B (Tier 3 SaaS-A, 44 files)** — access + billing + compliance (2
  only) + finance (14) + notifications + observability + shared
- **Pass C (Tier 3 SaaS-B, 38 files)** — identity + growth + platform + sdk
- **Pass D (Frontend, 48 files)** — Group A + B + C

Each pass is disjoint; a sub-agent can own one pass.

---

## 8. Skip-bucket READMEs

Under the Tier-4 dirs that don't get catalog.json, drop a `README.md` with:

- Bucket name + purpose (e.g. "Sports domain modules — vertical")
- Why no `catalog.json` (Tier 4 rationale from `docs/backend-package-tiers.md`)
- List of packages inside
- Reference to `docs/backend-package-tiers.md` for the full taxonomy

For `sports/README.md`, `products/README.md`, `workflow/README.md` create new.
For `platform/{branch,facility,reception,safeguarding,teams}` and
`finance/{membership,digital-passes}`: leave existing READMEs alone.

---

## Verify

```sh
# 1. Schema on disk
ls -la .ref/schemas/catalog.v1.json

# 2. Schema on gist (may need cache-bust)
curl -sSfL "https://gist.githubusercontent.com/stackra-user/073a1ab687cd93ede7ae927b96a025ea/raw/catalog.v1.json?_=$(date +%s)" | \
  python3 -c 'import json,sys ; d=json.load(sys.stdin) ; print("OK" if "$schema" in d.get("properties",{}) else "FAIL")'

# 3. Tier doc
wc -l docs/backend-package-tiers.md   # → ~250 lines

# 4. Catalog counts
find packages/backend -name catalog.json | wc -l    # → 108
find packages/frontend -name catalog.json | wc -l   # → 48
# Total: 156

# 5. Every catalog.json validates against the schema (spot check via python)
python3 - <<'PY'
import json, pathlib, re
name_re = re.compile(r'^([a-z0-9-]+/[a-z0-9-]+|@[a-z0-9-]+/[a-z0-9-]+)$')
tiers = {'foundation','framework','saas','domain'}
surfaces = {'core','react','native','testing'}
required = {'$schema','name','tier','surfaces','purpose','capabilities','maturity'}
bad = 0
for p in list(pathlib.Path('packages/backend').rglob('catalog.json')) + \
         list(pathlib.Path('packages/frontend').rglob('catalog.json')):
    d = json.loads(p.read_text())
    missing = required - set(d.keys())
    if missing: print(f'FAIL {p}: missing {missing}'); bad += 1; continue
    if d['tier'] not in tiers: print(f'FAIL {p}: bad tier'); bad += 1
    for s in d.get('surfaces',[]):
        if s not in surfaces: print(f'FAIL {p}: bad surface {s}'); bad += 1
    if not name_re.match(d['name']): print(f'FAIL {p}: bad name'); bad += 1
    if len(d.get('purpose',''))>200: print(f'FAIL {p}: purpose too long'); bad += 1
print(f'\n{bad} failures')
PY

# 6. Skip-bucket READMEs exist
ls packages/backend/sports/README.md \
   packages/backend/products/README.md \
   packages/backend/workflow/README.md

# 7. add-catalog-schema.py is idempotent
python3 scripts/add-catalog-schema.py --dry-run --quiet   # → 156 skipped
```

---

## Source of truth

`fullplan.md` — search for "catalog.v1.json", "backend-package-tiers.md",
"add-catalog-schema.py", "SCHEMA_URL", "108 backend", "48 frontend", "156
files", the gist URL. Every specific number and boundary call is already fixed
in fullplan.md.
