# sports/performance — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; personal-best + leaderboard pending

## Scope

Quantitative performance tracking — times (100m sprint, 5k run),
weights (bench press), scores (free-throw percentage). Distinct from
`sports/progress` (which owns qualitative skill assessment). Feeds
personal-bests, leaderboards, and the athlete's home-screen
"my recent performance" widget.

## What landed

- Scaffolded model + `PerformanceInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`RecordPerformanceAction`** — POST /performances. Requires
  `metric_key` (from the sport's attribute registry) + `value` +
  `unit`. Fires `PerformanceRecorded`.
- **`PersonalBestAction`** — GET /athletes/{athlete}/personal-bests.
  Returns the best-ever value per (metric_key). Time-metrics
  aggregated by MIN, weight/score by MAX.
- **`LeaderboardAction`** — GET /leaderboards/{sport_key}?age_group=X.
  Top N athletes by (metric_key). Scoped to the current season by default.
- **`ListPerformanceAction`**, **`ShowPerformanceAction`**.

### Services

- **`PersonalBestCalculator`** — cached per-athlete rollup.
  Invalidated on new PerformanceRecorded.
- **`LeaderboardBuilder`** — Redis-cached top-N materialisation
  per (sport_key, age_group, metric_key, season_id).
- **`MetricRegistry`** — the per-sport metric catalog (via
  attribute-registry). Ensures a payload's metric_key exists.

### Events

- `PerformanceRecorded`, `PersonalBestBroken`.

### Cross-module dependencies

- **`sports/athlete`** — the subject.
- **`sports/session`** — optional link — a performance can be
  attached to the session it was recorded in.
- **`sports/attribute-registry`** — metric_key registry.
- **`sports/season`** — leaderboard scope.

## Backlog priorities

1. **P0 — RecordPerformanceAction + metric_key validation**.
2. **P0 — PersonalBestCalculator + PersonalBestBroken event**.
3. **P1 — LeaderboardAction + Redis materialisation**.
