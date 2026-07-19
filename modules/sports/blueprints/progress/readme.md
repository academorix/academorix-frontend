# progress

Athlete skill development — the biggest Attributes consumer per blueprint §14.1.
Wave 3 sports module.

## 1. What this module owns

| Concern           | Owned artefact                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Skill assessment  | `ProgressAssessment` (`pra_`) — attribute-driven per (enrollment, capture_date) with snapshot of AttributeSet version. |
| Shareable card    | `ProgressCard` (`pcd_`) — rendered snapshot (FIFA card / radar / etc) with signed-URL sharing.                         |
| Coach observation | `CoachNote` (`cno_`) — immutable notes with visibility (coach_only / shared_with_parent / shared_with_athlete).        |
| Belt catalogue    | `BeltRank` (`blt_`) — ordered martial-arts rank progression per sport_key.                                             |
| Grading exam      | `GradingEvent` (`gre_`) — formal exam scheduled at a branch with examiner_coach.                                       |
| Grading outcome   | `GradingResult` (`grr_`) — per-athlete exam outcome (pass / fail / deferred) driving belt promotion.                   |

## 2. Attribute-driven cards

`ProgressAssessment` is a first-class Attributes consumer. Every assessment
captures:

- `values` JSONB — the attribute values keyed by definition code
- `attribute_set_snapshot_id` — the AttributeSet version this assessment was
  captured against (IMMUTABLE post-create)
- `sport_key` — denormalised from athlete_enrollment for indexed filtering

Historic assessments render correctly even after the set is versioned — the
snapshot pins them to the definitions that existed at capture time.

## 3. Card types (from sport registry)

| Sport family                | Card type             |
| --------------------------- | --------------------- |
| Football / rugby / hockey   | `fifa_card`           |
| Basketball / handball       | `attribute_card`      |
| Individual sports (generic) | `radar`               |
| Swimming / athletics        | `time_trial`          |
| Gymnastics / diving         | `apparatus_scores`    |
| Martial arts (belt-based)   | (no card — belt only) |

## 4. Belt progression

`BeltRank` seeded per sport_key from platform defaults (tenant_id=NULL); tenants
override with their own progression via tenant-scoped rows. `GradingResult`
records the per-exam per-athlete outcome; a `pass` fires `BeltRankPromoted`
which awards may consume.

## 5. Cascades

- Athlete transfer → progress records stay (career timeline principle).
- Enrollment archived → progress records survive; new assessments refused.
- Session cancelled → not applicable (progress is enrollment-scoped, not
  session-scoped).
- Tenant erased → cascade delete via FK.

## 6. What this module does NOT do

- Physical benchmarks — see `performance` (test batteries + percentiles).
- Medical / injury tracking — see `medical`.
- Talent pathway progression — see `development`.
- Awards / certificates — see `awards`.

## 7. ULID prefixes owned

- `pra_` — ProgressAssessment
- `pcd_` — ProgressCard
- `cno_` — CoachNote
- `blt_` — BeltRank
- `gre_` — GradingEvent
- `grr_` — GradingResult
