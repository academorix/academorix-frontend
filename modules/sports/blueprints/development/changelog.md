# development — changelog

## [Unreleased] — inception (Wave 3)

- Five entities: DevelopmentPathway / PathwayStage / ScoutingReport / TalentFlag
  / Goal.
- Attribute-driven promotion criteria (`PathwayStage.criteria` JSONB with
  snapshot).
- 9 events including `AthletePromoted`, `TalentFlagged`, `GoalAchieved`.
- Feeds awards on goal achievement.

### Dependencies

- `foundation`, `tenancy`, `application`, `attributes`, `athlete`,
  `athlete-enrollment`, `progress`, `performance`, `coaching`.

### ULID prefixes

- `dvp_`, `dvs_`, `sct_`, `tfg_`, `gol_` — registered.
