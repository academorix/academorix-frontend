# sports/progress — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; assessment workflow pending

## Scope

Skill assessments + report cards + parent-facing progress notes.
Coaches write assessments; parents see them. The core value flow for
"why did I pay for this?".

## What landed

- Scaffolded model + `ProgressInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`RecordAssessmentAction`** — POST /progress. Preconditions:
  - Caller is assigned to the athlete's team (gate via
    `sports/coaching`).
  - Athlete has an active enrollment for the assessment's season.
  Fires `AssessmentRecorded`.
- **`PublishReportCardAction`** — POST
  /athletes/{athlete}/report-cards. Aggregates every assessment in
  the current season into one report. Runs the PDF renderer via
  platform/storage. Notifies the parent guardian on publish.
- **`AttachEvidenceAction`** — POST /progress/{progress}/evidence.
  Upload a video / photo / PDF as evidence for an assessment.
  Files stored via platform/storage with a 30-day signed URL.
- **`TrendAction`** — GET /athletes/{athlete}/progress/trend. Time-
  series of every assessment score for the athlete.

### Services

- **`ProgressAuthor`** — write-side orchestrator. Enforces the
  coach-assigned-to-athlete's-team gate.
- **`ReportCardCompiler`** — aggregation service. Reads every
  assessment + attendance + performance record for the season.
- **`SkillMatrixResolver`** — the sport-specific skill matrix
  (e.g. football: ball control, first touch, passing, shooting,
  positioning). Attribute-driven per sport_key + age_group.

### Cross-module dependencies

- **`sports/coaching`** — authorisation gate.
- **`sports/attendance`** — feeds the report card.
- **`sports/performance`** — feeds the report card.
- **`sports/attribute-registry`** — SDUI skill matrix.
- **`platform/storage`** — PDF + evidence file storage.

## Backlog priorities

1. **P0 — RecordAssessmentAction + gate**.
2. **P0 — PublishReportCardAction + PDF render + parent notify**.
3. **P1 — AttachEvidenceAction**.
4. **P2 — TrendAction (time-series)**.
