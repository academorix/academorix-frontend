# season — changelog

## [Unreleased] — inception (Wave 3a)

- Season module authored. One owned entity:
  - `Season` (`sea_` prefix) — time-bounded competition / training cycle.
- Six lifecycle statuses: planned → registration_open → in_progress → playoffs
  → completed → archived. Transitions auto-flipped by `RollSeasonPhaseJob`
  (hourly cron) or manually via `season:*` actions.
- Scoping tuple `(tenant_id, organization_id, branch_id, sport_key)` — a
  Season can be tenant-wide, org-scoped, branch-scoped, and/or sport-scoped.
- Load-bearing invariant: exactly one `is_current=true` per scoping tuple —
  enforced by partial unique index + observer auto-demote + nightly
  `ReconcileCurrentSeasonInvariantJob`.
- Five entitlement gates:
  - `sports_seasons` (boolean; Small=off, Medium+=on) — module master gate
  - `season_slot` (slot cap; Small=0, Medium=4/year, Enterprise=null)
  - `season_playoffs` (boolean; Medium+)
  - `season_late_registration` (boolean; Medium+)
  - `season_sport_scoping` (boolean; Enterprise-only)
- Default-season seed on `TenantProvisioned` for business_type IN
  `[sports_academy, school, federation, club]`. Non-seasonal business types
  (`sports_center`, `gym`) skip the seed.
- Registration window enforcement middleware (`season.enforce_registration_open`)
  refuses enrollment-adjacent routes outside the window unless the caller
  carries `season.enroll.late` permission.
- Downstream: Team.season_id (Wave 2b nullable), AthleteEnrollment.season_id
  (Wave 3+), Event.season_id (Wave 3+), Session.season_id (Wave 3+).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `branch`, `entitlements`.
- Extended by NONE. Wave 3+ athlete / event / session modules reference
  season via FK — that's `planned_consumers`, not `extendedBy`.
- Wave 3a inception release.

### Design notes

- Season does NOT carry `application_id` / `region_id` / `scope_node_id`.
- `organization_id` + `branch_id` are IMMUTABLE post-create (scoping tuple
  is a compositional identity — changing it would reparent every downstream
  enrollment).
- `sport_key` is IMMUTABLE post-in_progress status (drift signal).
- `start_date` / `end_date` edits post-in_progress require
  `season.dates.shift` permission (audit-critical — affects every enrolled
  athlete's calendar).
- `SeasonCurrentChanged` audit-critical because year-over-year reports
  pivot on `is_current`.
- Small tier is LOCKED OUT of the feature — Small tenants run always-on
  scheduling with no seasonal boundaries. Their teams have `season_id=null`
  perpetually.

### ULID prefix registration

- `sea_` (Season) — new. Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json` in the same commit as the schema landing.
