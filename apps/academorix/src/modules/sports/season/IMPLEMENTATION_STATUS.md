# sports/season — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; domain services + actions pending

## Scope

Time window every enrollment / attendance / progress / performance row is
tenant-scoped to. Every operational sports record belongs to exactly one Season.
Season boundaries drive:

- Enrollment rollovers (`sports/athlete-enrollment`).
- Age-group snapshot rolls (`sports/athlete`).
- Team roster resets (`sports/team`).
- Report card generation (`sports/coaching-report`).

## What landed

- Scaffolded model + `SeasonInterface` (TABLE + ATTR_* constants).
- CRUD action stubs (Create/Update/Show/List/Delete).
- Base repository via `#[AsRepository]`.
- Enums for season status (`Planned`, `Active`, `Completed`, `Archived`).

## What's pending

### Actions

- **`CreateSeasonAction`** — validated payload. Refuse overlapping seasons with
  `status = Active` on the same organisation.
- **`ActivateSeasonAction`** — POST /seasons/{season}/activate. Transitions from
  `Planned` → `Active`. At most ONE active season per organisation at a time
  (invariant). Fires `SeasonActivated` which triggers roster / age-group
  snapshot rollovers.
- **`CompleteSeasonAction`** — POST /seasons/{season}/complete. Precondition:
  end_date past. Cascade — close every open enrollment for the season.
- **`RolloverAction`** — POST /seasons/{season}/rollover. Creates the NEXT
  season from this one's template (name pattern, age windows, fee schedule).
  Optionally auto-enroll every active athlete into the new season on rollover.

### Services

- **`SeasonProvisioner`** — create + activate orchestrator. Enforces the
  single-active-season invariant + fires the cascade events.
- **`SeasonRolloverService`** — the copy-forward logic. Reads the source
  season + emits `SeasonRolledOver` with the new season id.
- **`SeasonSnapshotBuilder`** — build the season-level rollup for the report
  card / competition module (# enrollments, # sessions, # goals scored, etc.).

### Events

- `SeasonCreated`, `SeasonActivated`, `SeasonCompleted`, `SeasonRolledOver`.
- Listeners: sports/athlete's `RollAthleteAgeGroupSnapshotJob` fires on
  `SeasonActivated`.

### Cross-module dependencies

- **`sports/age-group`** — Age windows change per season. Every athlete's
  snapshot rolls at season activation.
- **`sports/athlete-enrollment`** — Every enrollment carries a `season_id`.
  Rollover creates new enrollment rows.
- **`sports/team`** — Roster is season-scoped. Rollover creates new Team rows or
  reactivates them.

## Backlog priorities

1. **P0 — CreateSeasonAction + single-active invariant**.
2. **P0 — ActivateSeasonAction + rollover cascade**.
3. **P1 — RolloverAction + SeasonRolloverService**.
4. **P2 — CompleteSeason + SnapshotBuilder**.
