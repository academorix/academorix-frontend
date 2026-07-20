# sports/competition — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; registration + ranking pending

## Scope

Competitive events — tournaments, meets, leagues. A Competition groups multiple
`sports/match-fixture` rows. Team + individual registration, result recording,
ranking, standings publication.

## What landed

- Scaffolded model + `CompetitionInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`CreateCompetitionAction`** — validated payload. Preconditions: at least one
  age group + gender category.
- **`RegisterTeamAction`** — POST /competitions/{competition}/teams.
  Precondition: team has ≥ minimum-roster active enrollments. Fires
  `TeamRegisteredForCompetition`.
- **`RegisterAthleteAction`** — POST /competitions/{competition}/athletes.
  Individual sports path. Age + gender check via athlete's snapshot.
- **`RecordResultAction`** — POST
  /competitions/{competition}/matches/{match}/result. Fires
  `CompetitionResultRecorded`. Cascades to ranking recomputation.
- **`RankingAction`** — GET /competitions/{competition}/rankings. Computed table
  — team + individual standings.
- **`PublishStandingsAction`** — POST /competitions/{competition}/publish.
  Freezes standings for archival; emits notifications to every registered team's
  coach.

### Services

- **`CompetitionRegistrar`** — write-side orchestrator.
- **`RankingComputer`** — pluggable per sport (Swiss, round-robin, knockout,
  league).
- **`StandingsMaterialiser`** — Redis cache + persist on publish.

### Cross-module dependencies

- **`sports/team`** — team registration.
- **`sports/athlete`** — individual registration.
- **`sports/match-fixture`** — child records.
- **`sports/season`** — competitions live inside a season.
- **`platform/branding`** — competition-specific branding overrides.

## Backlog priorities

1. **P0 — CreateCompetitionAction + RegisterTeamAction**.
2. **P0 — RecordResultAction + RankingComputer**.
3. **P1 — PublishStandingsAction + notification cascade**.
