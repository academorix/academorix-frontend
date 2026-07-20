# sports/attendance — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; bulk-mark + notify pending

## Scope

Per-session, per-athlete attendance record. Feeds:

- Progress reports (session count / attendance rate).
- Coaching notifications (auto-notify parent on 2+ consecutive absences).
- Compensation for coaches (paid per session actually delivered).
- Compliance retention (safeguarding trail).

## What landed

- Scaffolded model + `AttendanceInterface`.
- CRUD action stubs.
- Enums for `AttendanceStatus` (Present, Absent, Late, Excused, Injured, Sick).

## What's pending

### Actions

- **`MarkPresentAction`** / **`MarkAbsentAction`** /
  **`MarkLateAction`** / **`MarkExcusedAction`** — per-athlete
  status marks. Idempotent on (session_id, athlete_id) — one row
  per pair. Fire the appropriate `AttendanceMarked*` event.
- **`BulkMarkAction`** — POST /attendance/bulk. Payload:
  `session_id` + array of `[athlete_id, status]` tuples. Wrapped
  in a transaction. Fires `AttendanceBulkMarked` once per session.
- **`EndSessionAction`** — POST /sessions/{session}/end-attendance.
  Auto-mark every enrolled athlete without an attendance row as
  Absent. Fires `SessionAttendanceClosed`.
- **`ListAttendanceAction`** — GET /athletes/{athlete}/attendance +
  scope filters. Returns time-series.
- **`RateAction`** — GET /athletes/{athlete}/attendance-rate.
  Computed metric — # present / total sessions in the window.

### Services

- **`AttendanceProvisioner`** — write-side orchestrator.
  Verifies the athlete is enrolled in the session's team.
- **`AttendanceRateCalculator`** — pure computation.
- **`ConsecutiveAbsenceMonitor`** — nightly sweep.
  Fires `AthleteAtRisk` when an athlete has 2+ consecutive absences
  for parent-notification cascade.

### Events

- `AttendanceMarked` (single), `AttendanceBulkMarked`,
  `SessionAttendanceClosed`, `AthleteAtRisk`.

### Cross-module dependencies

- **`sports/session`** — an attendance row references a session.
- **`sports/athlete-enrollment`** — enrollment defines who's
  eligible on the sheet.
- **`notifications/notifications`** — the parent-notify cascade on
  consecutive-absences.

## Backlog priorities

1. **P0 — MarkPresent/Absent/Late/Excused Actions** (basic sheet).
2. **P0 — BulkMarkAction** (coach's daily flow — one payload for
   the whole team).
3. **P0 — EndSessionAction** (auto-close the sheet).
4. **P1 — AttendanceRateCalculator + endpoint**.
5. **P1 — ConsecutiveAbsenceMonitor** (nightly job).
