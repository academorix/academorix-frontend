# competition — changelog

## [Unreleased] — inception (Wave 3)

- Five owned entities: Competition / CompetitionTeam / CompetitionFixture /
  StandingRow / BracketNode.
- Four formats: round_robin / single_elimination / double_elimination /
  group_then_knockout.
- 8 events including `StandingsUpdated` (broadcast to public site) and
  `BracketAdvanced`.
- Standings computed via scoring strategy from sport registry per ScoringType.

### Dependencies

- `foundation`, `tenancy`, `application`, `athlete`, `athlete-enrollment`,
  `season`, `event`, `coaching`, `teams`.

### ULID prefixes

- `cmp_`, `cmt_`, `cmf_`, `std_`, `bkt_` — registered.
