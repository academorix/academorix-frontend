# season

Time-bounded competition / training cycle. Owns `Season` — the row that answers
"which competitive year are we in?". Wave 3a of the sports tier
(priority 52).

## 1. What this module owns

| Concern                              | Owned artefact                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Calendrical container                | `Season` (`seasons.tenant_id` + nullable `organization_id` + nullable `branch_id`) — start/end + registration windows   |
| Season-type catalogue                | `data/season-type-catalog.json` — the enum values (annual, academic_year, summer_camp, winter_camp, half_year, ...)     |
| Business-type auto-seed matrix       | `data/business-type-defaults.json` — which business_types auto-seed a default season on TenantProvisioned                |
| Auto-provisioning                    | `SeedDefaultSeasonForTenantJob` — dispatched on tenancy::TenantProvisioned for eligible business_types                   |
| Automatic phase transitions          | `RollSeasonPhaseJob` — hourly cron; transitions status based on now() vs registration + start + playoff + end dates      |
| One-current-per-scope invariant      | Exactly one `is_current=true` Season per `(tenant, organization, branch, sport_key)` tuple, enforced by observer + reconciler |
| Tenant surface                       | Full CRUD on `/api/v1/seasons` + lifecycle actions + the heavy-traffic `/api/v1/seasons/current` lookup                  |
| Platform-admin surface               | Cross-tenant read (`/api/v1/platform/seasons`)                                                                          |
| `BelongsToSeason` trait              | For Team, AthleteEnrollment, Event, Session (Wave 3+) — the sports rows that anchor to a Season                          |
| `season.resolve_active` middleware   | Resolves the caller's active season from `X-Season-Id` or the current season for the caller's scope                     |
| `season.enforce_registration_open`   | Refuses enrollment-adjacent writes when the target Season's registration window is closed                               |
| Entitlement gates                    | `sports_seasons` (Small=0/off, Medium+), `season_slot` (Medium=4/year, Enterprise=∞), `season_playoffs`, `season_late_registration`, `season_sport_scoping` |

### 1.1 Season is Wave 3a — the first sports-module blueprint

Season lands with **NO existing sports modules on disk**. Every downstream
consumer listed in `module.json.planned_consumers` — `athlete`,
`athlete-enrollment`, `event`, `session`, `teams`, `finance`, `notifications`,
`attendance` — is still on the roadmap. Wave 3a establishes the temporal
substrate (Season) so those modules can compose it when they land. Team is
planned to carry `season_id` as **nullable** in Wave 2b so the two modules can
be authored independently; every subsequent sports row (AthleteEnrollment,
Event, Session) will carry `season_id` as **required**.

### 1.2 Small tier is intentionally locked out

Small-tier tenants run **always-on scheduling** — no seasonal boundaries, every
roster is perpetual. The `sports_seasons` entitlement is off by default on
Small (per `hierarchy.md` §7); every route + observer + SDUI surface in this
module respects that gate. Medium tenants get up to 4 seasons per year;
Enterprise unlimited. A Small tenant that upgrades to Medium can start
authoring seasons immediately — no migration required on their existing rows
because Small never referenced a `season_id`.

### 1.3 Scoping tuple — tenant / organization / branch / sport_key

Season carries three optional scoping columns beyond `tenant_id`:

- **`organization_id`** (nullable, RESTRICT) — when set, the Season only
  applies to teams/enrollments/events belonging to that Organization. Enables
  a multi-brand tenant to run different seasons per brand.
- **`branch_id`** (nullable, RESTRICT) — when set, the Season only applies to
  teams/enrollments/events belonging to that Branch. Enables a multi-venue
  tenant to run different seasons per venue.
- **`sport_key`** (nullable) — when set, the Season only applies to
  teams/enrollments/events with matching `sport_key`. Enterprise-only via the
  `season_sport_scoping` entitlement. Enables a multi-sport tenant to run
  distinct seasons per sport (football Sep-Jun; basketball Nov-Apr;
  swimming perpetual).

The `is_current=true` invariant applies **per tuple**: a tenant may have
several concurrent current seasons if they're in different scope tuples.
Enforced by a partial unique index using `COALESCE(...)` per column.

### 1.4 Every eligible tenant gets a default season on TenantProvisioned

Tenants subscribing to a **seasonal** business_type (`sports_academy`,
`school`, `federation`, `club`) get a default Season seeded on
TenantProvisioned. Non-seasonal business_types (`sports_center`, `gym`) do
NOT auto-seed — they run always-on scheduling regardless of tier. The
`SeedDefaultSeasonOnTenantProvisioned` listener + hook check
`data/business-type-defaults.json` before dispatching
`SeedDefaultSeasonForTenantJob`. Idempotent — safe to re-run.

## 2. The row-level attribution contract

Season carries `tenant_id` + optional `organization_id` + optional
`branch_id`. Per `.kiro/steering/tenancy-columns.md` §3 + §5:

- ✅ `seasons.tenant_id` — required, FK to `tenants.id`, `onDelete=cascade`
- ✅ `seasons.organization_id` — optional, FK to `organizations.id`,
  `onDelete=restrict`
- ✅ `seasons.branch_id` — optional, FK to `branches.id`, `onDelete=restrict`
- ❌ `seasons.application_id` — FORBIDDEN. Application cascades through
  `tenants.application_id` (Season is NOT one of the 8 rows in
  `tenancy-columns.md` §2 that carry `application_id` directly).
- ❌ `seasons.region_id` — FORBIDDEN. Seasons are commercial-zone-agnostic;
  regional differentiation is handled by scoping via `organization_id`
  (an org typically maps to a region on multi-region tenants) or via
  duplicating the season per branch.
- ❌ `seasons.scope_node_id` — FORBIDDEN. Season is NOT a scope consumer;
  it's a temporal scoping mechanism of its own.
- ❌ `seasons.parent_id` — FORBIDDEN. Seasons are flat; there's no "child
  season" concept. Overlapping seasons in the same scope tuple are just
  separate rows.

Cross-tenant FKs from Season to any other aggregate are forbidden. The
scoping-tuple invariant (`branch.organization_id === season.organization_id`
when both are set) is enforced by the observer.

## 3. Tier boundaries

Per `hierarchy.md` §7 tier matrix + this module's entitlements:

| Tier       | Feature      | Seasons/year cap | Playoffs | Late-registration | Sport-scoping |
| ---------- | ------------ | ---------------- | -------- | ----------------- | ------------- |
| Small      | disabled     | 0                | ❌       | ❌                | ❌            |
| Medium     | enabled      | 4                | ❌       | ✅                | ❌            |
| Enterprise | enabled      | unlimited        | ✅       | ✅                | ✅            |

Backed by five entitlements — see `entitlements.json`. Downgrading Medium →
Small does NOT auto-archive existing Seasons; the entitlement reconciler
surfaces the drift + suggests a manual archive path (matching the region /
organization pattern).

## 4. Lifecycle timeline + phase transitions

Every Season follows the same state machine. Automatic transitions run via
`RollSeasonPhaseJob` (hourly cron); manual overrides are gated by the
matching `season.<action>` permission.

```
[planned]           default on create
    ↓ (registration_opens_at reached OR admin opens)
[registration_open]
    ↓ (registration_closes_at reached OR admin closes)
[registration_closed]  intermediate — bookings blocked until start
    ↓ (start_date reached OR admin starts)
[in_progress]
    ↓ (playoff_starts_at reached, has_playoffs=true)
[playoffs]
    ↓ (end_date reached OR admin completes)
[completed]
    ↓ (admin archives)
[archived]  soft-deleted (deleted_at set); hidden from selectors
    ↓ (restore within retention window)
[completed]
    ↓ (retention expires; PurgeArchivedSeasonsJob runs)
[hard-deleted]  fires SeasonDeleted { mode: 'hard' }
                audit row survives 7 years (financial retention)
```

Two guardrails:

- **`is_current=true` cannot be deleted / archived / re-scoped.** The caller
  must promote another Season to current in the same scope tuple first.
  Every guard is `409` with a specific error code (`CANNOT_ARCHIVE_CURRENT_SEASON`,
  `CANNOT_DELETE_CURRENT_SEASON`).
- **Seasons with active enrollments cannot be archived** (Wave 3a placeholder
  check — refuses with `SEASON_HAS_ACTIVE_ENROLLMENTS` when
  AthleteEnrollment / Team.season_id references exist).

## 5. Registration windows

Every Season may carry three optional timestamps:

- **`registration_opens_at`** — when the enrollment surface accepts writes.
- **`registration_closes_at`** — when the surface refuses new writes.
- **`late_registration_ends_at`** — grace window past
  `registration_closes_at` for tenants that opted into late-registration
  (Medium+, entitlement `season_late_registration`, requires
  `allows_late_registration=true` + `late_registration_fee_cents>0`).

The `season.enforce_registration_open` middleware guards every
enrollment-adjacent route on the athlete side (Wave 3+):

- **Before `registration_opens_at`** → 409 `SEASON_REGISTRATION_NOT_OPEN`.
- **After `registration_closes_at` + no late window** → 409
  `SEASON_REGISTRATION_CLOSED`.
- **After `registration_closes_at` + inside late window** → allowed but the
  caller must carry the `season.enroll.late` permission (surcharge applies —
  Wave 4 finance module attaches the fee).
- **After `late_registration_ends_at`** → 409 same as above.

Registration windows are OPTIONAL on the schema level. A Season without any
registration timestamps has an always-open window (Wave 3 athlete-enrollment
observer treats it as such). This matches the "casual" academy use case.

## 6. The current-season contract

The `/api/v1/seasons/current` endpoint is the highest-traffic in this
module — the frontend calls it on every page load to render the season chip
+ every enrollment surface calls it to gate writes. It's cached
per-`(tenant, organization, branch, sport_key)` tuple with a 5-minute TTL,
invalidated on any `is_current` flip or state transition.

`CurrentSeasonResolver` — the DI binding behind this endpoint — accepts a
scope hint object and walks the tuple from most-specific to least-specific:

1. `(tenant_id, organization_id, branch_id, sport_key)` — exact match
2. `(tenant_id, organization_id, branch_id, null)` — sport-agnostic within
   this branch
3. `(tenant_id, organization_id, null, sport_key)` — branch-agnostic within
   this org, sport-specific
4. `(tenant_id, organization_id, null, null)` — org-wide, sport-agnostic
5. `(tenant_id, null, null, sport_key)` — tenant-wide, sport-specific
6. `(tenant_id, null, null, null)` — tenant-wide fallback

The first match wins. Null return means "no season is currently in this
scope" — callers must handle it (typically by hiding season-picker UI or
redirecting to a "no active season" empty state).

## 7. What this module does NOT do

- **Doesn't own teams.** Wave 2b `teams` module ships `Team` with a nullable
  `season_id`. This module only ships the trait Team composes.
- **Doesn't own athletes or enrollments.** Wave 3 `athlete` + `athlete-enrollment`
  modules own those aggregates. This module ships the FK reference contract
  but never touches those rows directly.
- **Doesn't manage season-specific pricing.** Finance module Wave 4 owns
  pricing; a Season can carry a `late_registration_fee_cents` scalar as a
  denormalised hint, but the actual invoicing lives in finance.
- **Doesn't overlap seasons in same tuple.** Two seasons in the same
  `(tenant, org, branch, sport_key)` tuple may legitimately have overlapping
  date ranges (a late season may start before an early season completes) —
  the module does NOT refuse overlap. Only ONE is `is_current=true` in the
  tuple; the others are `planned` / `registration_open` / `completed` /
  `archived`.
- **Doesn't roll Team rosters between seasons.** Wave 3 team module owns
  the roster-inheritance flow; this module's job ends at the Season row.
- **Doesn't auto-provision for Small tier.** The seed listener respects the
  `sports_seasons` entitlement — Small tenants get no default season even
  if their business_type is `sports_academy`. If they upgrade, they create
  their first season manually.
- **Doesn't auto-provision for non-seasonal business_types.**
  `sports_center` and `gym` skip the seed regardless of tier. The listener
  reads `data/business-type-defaults.json` before dispatching.
- **Doesn't clone seasons.** A "same shape as last year" flow lives in the
  admin UI (client-side pre-fill of the create form from the previous
  season's values); the backend just creates a fresh row.
- **Doesn't nest.** Seasons are flat. A three-term academic year is three
  Season rows (`autumn-term`, `spring-term`, `summer-term`), not one Season
  with three children.

## 8. Wave 3a scope boundaries

The tenant module fires `TenantProvisioned` — this module's listener seeds
the default season for NEW eligible tenants going forward. Existing tenants
at deploy time are handled by the one-shot
`season:seed-defaults-for-legacy-tenants` command that iterates every
eligible seasonal-business_type tenant that lacks a default season +
dispatches `SeedDefaultSeasonForTenantJob` for each. Idempotent — safe to
re-run.

Team's `season_id` FK ships as **nullable** in the concurrent Wave 2b
teams module so both modules can be authored independently. Once the Wave 3
athlete-enrollment module lands with its own required `season_id`, the
teams module will follow suit — but that's a separate migration.

## 9. Cross-references

- `.kiro/steering/hierarchy.md` §1a — canonical vocabulary (Season is the
  calendrical container)
- `.kiro/steering/hierarchy.md` §7 — tier matrix (season_slot per tier)
- `.kiro/steering/hierarchy.md` §14 — belongs-to matrix (Season → Tenant,
  optionally Organization + Branch)
- `.kiro/steering/tenancy-columns.md` §3 — the tenant_id mandate (Season
  carries tenant_id + optional org/branch)
- `.kiro/steering/tenancy-columns.md` §5 — forbidden columns
  (application_id + region_id + scope_node_id on seasons)
- `modules/platform/blueprints/organization/` — Organization is one of
  Season's optional scoping axes
- `modules/platform/blueprints/branch/` — Branch is one of Season's
  optional scoping axes
- `modules/platform/blueprints/tenancy/` — the parent Tenant module firing
  `TenantProvisioned`
- `modules/products/README.md` — product-scoped module tier index
