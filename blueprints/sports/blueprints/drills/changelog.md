# drills — changelog

## [Unreleased] — inception (Wave 3)

- Six entities: Drill / DrillCategory / SessionPlan / SessionPlanItem /
  Curriculum / CurriculumWeek.
- Search integration via `Searchable` trait — drills indexed by
  name/objective/tags/coaching_points.
- Curriculum cloning: deep-copy including all weeks + session plans.
- 7 events including `DrillPublished` and `CurriculumCloned`.

### Dependencies

- `foundation`, `tenancy`, `application`, `registry`, `session`, `coaching`,
  `storage`, `search`.

### ULID prefixes

- `dri_`, `dcg_`, `spl_`, `spi_`, `cur_`, `cwk_` — registered.
