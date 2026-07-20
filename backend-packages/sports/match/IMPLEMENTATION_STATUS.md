# sports/match — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; lineup + scoring pending

## Scope

A single match / fixture within a Competition (or standalone
friendly). Owns the pre-match lineup, per-match scoreline, and
postpone / cancel lifecycle.

The module is named `sports/match` in the repo — the domain concept
is "match fixture" per the priority list. All references in code
use `Match` classes; the display terminology is `Fixture` per
tenant.

## What landed

- Scaffolded model + `MatchInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`CreateMatchAction`** — POST /matches. Preconditions: valid
  competition context (when scoped to one) + valid home/away teams
  or single-team practice fixture.
- **`SetLineupAction`** — POST /matches/{match}/lineup. Payload:
  starting XI + substitutes. Validates every athlete is on the
  team's active enrollment roster. Fires `MatchLineupSet`.
- **`RecordScoreAction`** — POST /matches/{match}/score. Cascades
  to competition ranking (via `sports/competition`). Fires
  `MatchScoreRecorded`.
- **`PostponeAction`** — POST /matches/{match}/postpone. New date
  required. Notifies both team coaches.
- **`CancelAction`** — POST /matches/{match}/cancel. Reason
  required. Optional refund cascade (if tickets were sold via
  finance/order).

### Services

- **`MatchScheduler`** — write-side orchestrator.
- **`LineupValidator`** — enforces roster membership.

### Cross-module dependencies

- **`sports/team`** — home/away roster.
- **`sports/competition`** — parent competition (optional).
- **`sports/attendance`** — post-match, roll the lineup into attendance.

## Backlog priorities

1. **P0 — CreateMatchAction + SetLineupAction**.
2. **P0 — RecordScoreAction + competition-ranking cascade**.
3. **P1 — Postpone + Cancel Actions**.
