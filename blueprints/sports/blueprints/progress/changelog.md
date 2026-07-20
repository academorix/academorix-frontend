# progress — changelog

## [Unreleased] — inception (Wave 3)

- Progress module authored. Six owned entities:
  - `ProgressAssessment` (`pra_`) — attribute-driven skill assessment with
    immutable AttributeSet snapshot.
  - `ProgressCard` (`pcd_`) — shareable render (FIFA / radar / time_trial /
    apparatus_scores).
  - `CoachNote` (`cno_`) — immutable observation with widening-only visibility.
  - `BeltRank` (`blt_`) — ordered martial-arts rank per sport_key.
  - `GradingEvent` (`gre_`) — formal exam distinct from Session.
  - `GradingResult` (`grr_`) — per-athlete exam outcome.
- Attributes integration: ProgressAssessment composes `HasAttributeSet` +
  `HasSchemalessAttributes`. Values validated at save against active set
  version; snapshot preserved for historic render.
- Load-bearing invariants:
  - CoachNote body IMMUTABLE post-create — mutations create a new revision via
    `revision_of_id`.
  - Visibility can only widen (coach_only → shared; reverse REFUSED).
  - GradingResult.to_belt.rank_order > from_belt.rank_order — belt progression
    cannot go backwards.
  - attribute_set_snapshot_id IMMUTABLE — historic assessments always render at
    their captured set version.
- 9 published events including `BeltRankPromoted` (feeds awards module) and
  `CoachNoteShared` (parent notifications).
- Retention: 7 years post-athlete-enrollment archival (progress is
  coaching-material); 10 years Enterprise. GradingResult retained indefinitely
  (belt provenance).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `attributes`, `athlete`,
  `athlete-enrollment`, `attendance`, `coaching`, `storage`.
- Planned consumers: awards, development, reporting, ai, public-site.

### ULID prefix registration

- `pra_`, `pcd_`, `cno_`, `blt_`, `gre_`, `grr_` — registered in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
