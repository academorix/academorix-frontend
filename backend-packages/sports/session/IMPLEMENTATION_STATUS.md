# sports/session — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; scheduling logic pending

## Scope

A planned coaching event on a facility at a specific time window,
with a team, a coach, and (optionally) an attendance sheet.
`sports/attendance` writes rows against `sports/session` — the two
modules are the atomic coaching-day pair.

## What landed

- Scaffolded model + `SessionInterface`.
- CRUD action stubs.
- Enums for `SessionStatus` (Scheduled, InProgress, Completed,
  Cancelled) + `SessionKind` (Training, Match, Trial, Assessment).

## What's pending

### Actions

- **`ScheduleAction`** — POST /sessions. Preconditions:
  - Facility available in the time window (call
    `platform/facility`'s `BookingAvailabilityChecker`).
  - Coach not double-booked (self-check).
  - Team's roster capacity respected (soft-check).
  Consume `session_slot` from entitlements.
- **`CancelAction`** — POST /sessions/{session}/cancel. Reason
  required. Notifies every enrolled athlete's parent guardian via
  notifications/messaging. Optionally releases the facility booking.
- **`MoveAction`** — POST /sessions/{session}/move. Atomic:
  release the old facility booking, reserve the new one. Notifies
  attendees.
- **`SplitAction`** — POST /sessions/{session}/split. Break one
  session into N smaller groups (e.g. split a U12 team into
  offense/defense drills). Copies the roster + adjusts attendance
  ownership.
- **`MergeAction`** — Inverse of split.
- **`RecurringAction`** — POST /sessions/recurring. Create N
  sessions from an RRULE pattern (e.g. "every Tues + Thurs 4pm,
  10 weeks"). Uses `sabre/vobject`'s RRULE expander.
- **`CompleteAction`** — POST /sessions/{session}/complete.
  Precondition: attendance recorded. Fires `SessionCompleted` →
  triggers `sports/progress`'s optional post-session assessment hook.

### Services

- **`SessionScheduler`** — write-side orchestrator. Enforces the
  facility + coach availability preconditions.
- **`RecurringSessionExpander`** — RRULE → concrete session dates.
- **`SessionCascadeService`** — split / merge orchestration.

### Events

- `SessionScheduled`, `SessionCancelled`, `SessionMoved`,
  `SessionSplit`, `SessionMerged`, `SessionCompleted`.

### Cross-module dependencies

- **`platform/facility`** — booking availability + reservation.
- **`sports/coaching`** — coach schedule query.
- **`sports/team`** — roster query.
- **`sports/attendance`** — reads on `SessionCompleted`.

## Backlog priorities

1. **P0 — ScheduleAction + facility booking integration**.
2. **P0 — CancelAction + notification cascade**.
3. **P1 — RecurringAction + RRULE expander**.
4. **P2 — Split / Merge Actions**.
