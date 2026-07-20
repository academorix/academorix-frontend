# sports/development — Phase 3 implementation status

## Status: SCAFFOLDED — module skeleton + interface landed; pathway logic pending

## Scope

Long-term athlete development pathway. The multi-season plan that follows an
athlete from U8 through U18 (or Adult). Distinct from `sports/progress`
(per-session assessment) — development is the strategic plan; progress is the
tactical measurement.

## What landed

- Scaffolded model + `DevelopmentInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`SetPathwayAction`** — POST /athletes/{athlete}/pathway. Assigns a pathway
  template (e.g. "Football U8→U18 competitive"). Fires `PathwayAssigned`.
- **`AttachMilestoneAction`** — POST /pathways/{pathway}/milestones. Milestone:
  age + metric threshold + evidence requirement. E.g. "Complete 100m under 15s
  by end of U12".
- **`RecordMilestoneAchievedAction`** — POST
  /pathways/{pathway}/milestones/{milestone}/achieved. Auto-verified when a
  performance record crosses the threshold; manual verify otherwise.
- **`TransitionAction`** — POST /pathways/{pathway}/transition. Age-group
  graduation. Fires `PathwayTransitioned`.

### Services

- **`PathwayProvisioner`** — the assign flow.
- **`MilestoneAutoVerifier`** — listens to `PerformanceRecorded` + auto-marks
  matching milestones as achieved.
- **`PathwayTemplateRegistry`** — per-tenant catalog of pathway templates.

### Cross-module dependencies

- **`sports/athlete`** — the subject.
- **`sports/performance`** — auto-verify feeder.
- **`sports/age-group`** — transitions.

## Backlog priorities

1. **P0 — SetPathwayAction + AttachMilestoneAction**.
2. **P1 — MilestoneAutoVerifier (event listener)**.
3. **P2 — TransitionAction + season-boundary batch**.
