# sports/athlete-enrollment — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; workflow pending

## Scope

The roster attachment between an Athlete and a (Team + Season) pair. Owns the
paid enrollment lifecycle from application → active → completed/withdrawn. Feeds
attendance, progress, and competition.

## What landed

- Scaffolded model + `AthleteEnrollmentInterface`.
- CRUD action stubs.
- Enums for `EnrollmentStatus` (Applied, Waitlisted, Active, Withdrawn,
  Completed).

## What's pending

### Actions

- **`EnrollAction`** — POST /enrollments. The canonical enrollment path.
  Preconditions:
  - Athlete has guardian coverage if minor (call
    `AthleteProvisioner::assertGuardianCoverage`).
  - Athlete's `current_age_group_id` matches the Team's `age_group_id`.
  - Season is Active (or Planned when `allow_early_enrollment`).
  - Waiver signed OR waiver-not-required per Team config.
  - Prerequisite check: the athlete has passed the prior-level team's completion
    (soft-check).
  - Consume `enrollment_slot` from billing/entitlements. Fires
    `AthleteEnrolled`.
- **`WithdrawAction`** — POST /enrollments/{enrollment}/withdraw. Reason
  required. Refund policy delegates to finance/refund.
- **`TransferAction`** — POST /enrollments/{enrollment}/transfer. Move to a
  different team within the same season. Atomic: release the slot, reserve on
  target, adjust attendance ownership.
- **`RolloverAction`** — POST /enrollments/{enrollment}/rollover. Auto-enroll
  into the next season's equivalent team when the source season completes.
- **`CompleteAction`** — POST /enrollments/{enrollment}/complete. End-of-season
  graduation. Triggers coaching-report generation.
- **`ListEnrollmentAction`**, **`ShowEnrollmentAction`**.

### Services

- **`EnrollmentProvisioner`** — write-side orchestrator. Owns the precondition
  chain + entitlement slot consumption.
- **`PrerequisiteChecker`** — pluggable per-tenant check (e.g. "must have
  completed U8 to enroll in U10"). Reads the athlete's completed enrollments.
- **`RolloverPipeline`** — season-boundary batch job that auto-enrolls the
  season's active athletes into the next season.

### Events

- `AthleteEnrolled`, `AthleteEnrollmentWithdrawn`,
  `AthleteEnrollmentTransferred`, `AthleteEnrollmentCompleted`,
  `EnrollmentPrerequisiteFailed`.

### Cross-module dependencies

- **`sports/athlete`** — guardian coverage + age group snapshot.
- **`sports/team`** — target Team validation + slot reservation.
- **`sports/season`** — the (season, team) tuple defines what's rostered.
- **`billing/entitlements`** — `enrollment_slot` consumption.
- **`finance/order`** — the enrollment fee. Enrollment creates an Order +
  Invoice via the finance module's Actions.

## Backlog priorities

1. **P0 — EnrollAction + full precondition chain**.
2. **P0 — WithdrawAction + refund cascade**.
3. **P1 — TransferAction (atomic team-swap)**.
4. **P1 — RolloverPipeline** (season boundary sweep).
5. **P2 — PrerequisiteChecker** (per-tenant customisable rules).
