# sports/age-group — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; snapshot recompute pending

## Scope

Age classification catalog (U8, U10, U12, U14, U16, U18, Adult, Masters,
etc.). Per-tenant customizable — a swim club and a football academy
will have different windows. Every athlete carries a materialised
snapshot pointer (`athletes.current_age_group_id`) resolved via
`sports/athlete`'s `AgeGroupSnapshotResolver`.

## What landed

- Scaffolded model + `AgeGroupInterface`.
- Full column set including sport-specific fields
  (`sport_key`, `gender_category`, `cutoff_date_kind`,
  `cutoff_month`, `cutoff_day`).
- CRUD action stubs (Create/Update/Show/List/Delete).
- `AgeGroupSnapshotResolver` (in sports/athlete, commit `c4122c178`)
  is the read-side consumer.

## What's pending

### Actions

- **`CreateAgeGroupAction`** — validated payload. Refuse
  age-window overlaps within the same (sport_key, gender_category).
- **`UpdateAgeGroupAction`** — mutable except for
  `is_seeded = true` rows (seeded catalog is immutable — see
  the dual-source seed pattern per
  `.kiro/steering/enum-db-seed-dual-source.md`).
- **`RecomputeAthleteAssignmentsAction`** — POST
  /age-groups/{age-group}/recompute. Bulk re-run the snapshot
  resolver over every active athlete on the tenant. Batched via
  `RollAthleteAgeGroupSnapshotJob`. Fires
  `AgeGroupAssignmentsRecomputed` on completion.

### Seeder

- **`AgeGroupSeeder`** — seed the default catalog per sport
  (football: U6/U8/U10/U12/U14/U16/U18; swimming: 8&U, 10&U, 12&U,
  13-14, 15-16, 17-18; basketball: 12U/14U/16U/18U). Marked
  `is_seeded = true` so tenant admins can't modify them.

### Cross-module dependencies

- **`sports/athlete`** — consumes this module to materialise the
  snapshot. Landed.
- **`sports/team`** — teams are age-group-bound. A U12 team roster
  cross-checks the athlete's snapshot on enrollment.
- **`platform/organization`** — age-group catalog can override
  per-organisation (a multi-brand tenant may have different windows
  per brand).

## Backlog priorities

1. **P0 — AgeGroupSeeder** with defaults per shipped sport.
2. **P0 — CreateAgeGroupAction with overlap validation**.
3. **P1 — RecomputeAthleteAssignmentsAction**.
4. **P2 — UpdateAgeGroupAction with immutable seeded guard**.
