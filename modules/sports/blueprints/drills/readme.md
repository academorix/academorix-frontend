# drills

Drill library + curriculum per blueprint §14.5. Wave 3.

## Owned entities

- `Drill` (`dri_`) — search-indexed coaching drill.
- `DrillCategory` (`dcg_`) — tenant-authorable taxonomy.
- `SessionPlan` (`spl_`) — ordered drills for a training session.
- `SessionPlanItem` (`spi_`) — drill line in a plan.
- `Curriculum` (`cur_`) — multi-week structured plan.
- `CurriculumWeek` (`cwk_`) — weekly slot with SessionPlans + objectives.

## Search integration

`Drill.searchable()` indexes: name, objective, sport_key, age_band, tags,
coaching_points → fed to `shared/search` via `Searchable` trait.

## Curriculum cloning

`POST /curriculums/{curriculum}/clone` duplicates a curriculum + its weeks + its
session plans (deep copy), so an academy can run "U12 Football 2024-25" as a
clone of the 2023-24 curriculum with local edits.

## ULID prefixes

- `dri_`, `dcg_`, `spl_`, `spi_`, `cur_`, `cwk_`
