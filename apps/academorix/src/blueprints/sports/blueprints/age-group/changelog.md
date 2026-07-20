# age-group — changelog

## [Unreleased] — inception (Wave 3a of the sports tier)

- AgeGroup module authored. One entity: `AgeGroup` (tenant-scoped + optional
  organization-scoped, no `application_id`, no `region_id`, no `branch_id`, no
  `scope_node_id`, no `parent_id`).
- 10-entry default catalog shipped at `data/default-age-groups.json` covering U6
  / U8 / U10 / U12 / U14 / U16 / U18 (calendar_year cutoff, is_youth=true)
  - Adult (18-34, rolling_from_birthday, is_default=true) + Senior (35-100)
  - Masters (50-100).
- Sport-cutoff reference table shipped at `data/sport-cutoff-samples.json`
  covering 10 sport patterns from public federation docs (football EU + US,
  basketball, swimming, tennis, rugby, cricket, athletics, gymnastics, school
  programme). Advisory — Wave 3c will formalise the sports registry.
- Auto-provisioning: `SeedDefaultAgeGroupsOnTenantProvisioned` listener + hook
  dispatch `SeedDefaultAgeGroupsForTenantJob` on `tenancy::TenantProvisioned`.
  Seeded rows do NOT consume `age_group_slot` — they are a system invariant.
- Tenant-facing CRUD at `/api/v1/age-groups` — GET / POST / GET one / PATCH /
  DELETE + lifecycle actions (`set-default`, `archive`, `restore`) +
  hypothetical resolver (`GET /api/v1/age-groups/resolve`).
- Platform-admin surface at `/api/v1/platform/age-groups` for cross-tenant read.
- `BelongsToAgeGroup` trait for downstream models (Team Wave 2b, EventDivision
  Wave 3+, TeamRegistration Wave 3+). Adds the `ageGroup()` belongsTo relation
  - a `resolveInAgeGroup()` query scope + a `booted()` cross-tenant FK smuggling
    guard.
- `HasAgeGroupCatalog` trait on Tenant exposing sibling accessors +
  `defaultAgeGroup(?sport_key, ?organization_id)` +
  `resolveAgeGroupFor(dob, sport_key, on_date)`.
- `AgeGroupResolver` service —
  `resolveFor(dob, sport_key, on_date, organization_id)` returns the matching
  AgeGroup. Handles the four cutoff kinds via `CutoffDateCalculator`. Prefers
  sport-specific over generic when both match. Configurable indeterminate
  strategy (refuse / first_match / oldest_group; default: refuse).
- `CutoffDateCalculator` pure function — given (kind, month, day, birthday,
  on_date), returns the effective age. No side effects; unit-tested against the
  sport-cutoff samples.
- Four cutoff kinds: `calendar_year` (Jan 1), `academic_year` (specified month),
  `rolling_from_birthday` (actual age on resolution date), `custom_date`
  (specified month + day).
- Default-per-tuple invariant: exactly one `is_default=true` per (tenant_id,
  organization_id, sport_key). Observer enforces on write; DB partial unique
  index is the DB-level guard; `ReconcileAgeGroupDefaultInvariantJob` (nightly
  03:30 UTC) catches drift + optionally auto-heals per config.
- Immutability guards: `is_seeded`, `organization_id`, `tenant_id` are immutable
  post-create (`AGE_GROUP_IS_SEEDED_IMMUTABLE`, `AGE_GROUP_ORG_IMMUTABLE`,
  `TENANT_IMMUTABLE`).
- Denormalised `is_youth`: computed from `max_age_inclusive < 18` by the
  observer + stored for indexed filtering. Caller writes silently overridden.
- Bounds + cutoff audit-criticality: `min_age_inclusive` / `max_age_inclusive`
  changes fire `AgeGroupBoundsChanged`; `cutoff_date_kind` / `cutoff_month` /
  `cutoff_day` changes fire `AgeGroupCutoffChanged`. Both events cannot-opt-out
  notify tenant admins (eligibility impact); both audit rows retained 7 years
  (minor-safeguarding floor).
- Sport-specific overrides: `sport_key` (nullable) enables per-sport cutoff
  rules. Gated by `age_group_sport_specific` entitlement (Enterprise-only).
- Entitlements published: `age_group_custom` (Small=0, Medium+=1),
  `age_group_slot` (Small=0, Medium=20, Enterprise=∞),
  `age_group_sport_specific` (Enterprise-only).
- Feature keys published: `age_group.core`, `age_group.custom`,
  `age_group.edit_seeded`, `age_group.sport_specific`,
  `age_group.organization_scope`, `age_group.archive_restore`,
  `age_group.resolver_api`.
- Ten lifecycle events: `AgeGroupCreated`, `AgeGroupUpdated`,
  `AgeGroupBoundsChanged`, `AgeGroupCutoffChanged`, `AgeGroupSportKeyChanged`,
  `AgeGroupDefaultChanged`, `AgeGroupArchived`, `AgeGroupRestored`,
  `AgeGroupDeleted`, `AgeGroupCatalogSeeded`. Every event implements
  `ShouldDispatchAfterCommit`.
- Notifications: `AgeGroupCreatedNotification` (opt-in),
  `AgeGroupBoundsChangedNotification` (cannot-opt-out — eligibility impact),
  `AgeGroupDefaultChangedNotification` (cannot-opt-out — tier-pricing impact).
- Retention: 1095-day archived retention (3 years — matches rolling
  youth-development cohort windows). Enterprise tenants may extend up to 2555
  days (7 years — matches audit-row retention).
- Audit-log rows produced by this module retained 7 years per minor-safeguarding
  compliance floor (outlives their source AgeGroup on hard-delete).
- Analytics: 11 Segment `track` events. `age_group_id` (ULID) is anonymised;
  never emits Athlete identifiers (Athletes referenced only via aggregate
  counts).
- Health probes: 10 total covering table migration, default-catalog JSON load,
  tenant FK integrity, organization FK integrity, default-invariant, seeded-
  catalog-invariant, slug uniqueness, bounds consistency, cutoff consistency,
  purge queue drain.
- ULID prefix reserved: `age_` (AgeGroup). Foundation registry updated in the
  same commit.
- Two tenancy hooks: `SeedDefaultAgeGroupsOnTenantProvisioned` +
  `PreventAgeGroupOrphansOnTenantErased` so the tenant → age-group relationship
  survives tenant lifecycle transitions cleanly.
- One-shot deploy-time command: `age-group:seed-defaults-for-tenant --all`
  iterates every pre-existing tenant + dispatches
  `SeedDefaultAgeGroupsForTenantJob` for each. Idempotent.
- No middleware shipped — age groups are reference data, not a request-scoped
  scoping axis. The resolver accepts (dob, sport_key, on_date) as explicit
  arguments.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `entitlements`.
- Extended by: (none in Wave 3a). Wave 2b will start populating
  `teams.age_group_id`; Wave 3+ will introduce Athlete + AthleteEnrollment +
  EventDivision + TeamRegistration references.
- Planned consumers: `athlete`, `athlete-enrollment`, `teams`, `event`,
  `notifications`.

### Non-goals for this release

Every non-goal below stays out of this module. See `readme.md` §7 for the full
list.

- No cross-tenant age groups.
- No `application_id` on age_groups.
- No `region_id` or `branch_id` on age_groups.
- No auto-computed `is_youth` in requests (derived on write, stored so filters
  - indexes work).
- No enforcement of `AGE_GROUP_BOUNDS_INVALIDATE_ATHLETES` in Wave 3a (Athlete
  - AthleteEnrollment don't exist yet; Wave 3+ enables the check).
- No cross-federation-cutoff auto-migration (tenants explicitly pick their
  cutoff config; automated sync is a future Wave).
- No sports-registry validation on `sport_key` beyond syntax (Wave 3c hardens
  this).
- No age-group nesting via `parent_id` (flat catalogue; programme aggregate is a
  future concern).
- No AI-generated age-group suggestions (federation docs are the source of
  truth; automation is out of scope).
