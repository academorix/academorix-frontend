# competition

Leagues + tournaments + standings + brackets per blueprint §15.1. Wave 3.

## Owned entities

- `Competition` (`cmp_`) — root record with format + scoring_strategy.
- `CompetitionTeam` (`cmt_`) — registration with seed + group_code.
- `CompetitionFixture` (`cmf_`) — materialised via sports/event.
- `StandingRow` (`std_`) — denormalised league table row.
- `BracketNode` (`bkt_`) — knockout bracket position.

## Standings recomputation

On every `FixtureResultRecorded`, `RecomputeStandingsJob` fires and re-runs the
scoring strategy (from sport registry) against every completed fixture in the
competition. Standings updated in a single transaction, `StandingsUpdated` event
broadcast to `tenant.{id}.competitions.{competitionId}` for live UI.

## Formats

- **round_robin** — every team plays every other; standings by points/GD/GF.
- **single_elimination** — bracket; winner_advances_to_node_id chain.
- **double_elimination** — winner + loser bracket.
- **group_then_knockout** — round-robin groups → knockout final stage.

## ULID prefixes

- `cmp_`, `cmt_`, `cmf_`, `std_`, `bkt_`
