# session

A single practice / lesson / class instance. Wave 3b of the sports tier
(priority 65). Composes `facility::ResourceBooking` for the physical slot

- adds sport-specific fields (coach identity, curriculum, attendance, ratings,
  safeguarding).

## 1. What this module owns

| Concern                          | Owned artefact                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Session aggregate                | `Session` (`sessions.tenant_id` + `branch_id` + required `resource_booking_id`)                                                              |
| Attendance pivot                 | `SessionAttendance` (`session_attendance`) — athlete's attendance record with status / late minutes / check-in time                          |
| Session type catalog             | `data/session-type-catalog.json` — 11 session_types with typical duration + billing model + coach requirement                                |
| Automatic phase transitions      | `StartScheduledSessionsJob` + `CompleteFinishedSessionsJob` + `CancelUnderMinimumSessionsJob` (5-min cadence each)                           |
| Attendance count denormalisation | `ReconcileAttendanceCountsJob` — nightly reconciler that keeps checked_in / absent counters in sync                                          |
| Rating aggregation               | `AggregateSessionRatingsJob` — nightly; computes session_rating + feeds Coach.rating (Wave 2b)                                               |
| Safeguarding-incident chain      | `SessionMinorSafeguardingIncident` — top-severity audit + regulator-tier retention + cannot-opt-out notifications                            |
| Coach-continuity guardrails      | `SessionCoachReassigned` at <24h + minors registered fires critical audit + cannot-opt-out guardian notifications                            |
| Facility retirement cascade      | `CancelSessionsOnFacilityRetired` — auto-cancels sessions on retired facility                                                                |
| Tenant surface                   | Full CRUD on `/api/v1/sessions` + lifecycle actions + attendance sub-resource + coach assignment + ratings                                   |
| Platform-admin surface           | Cross-tenant read + cross-tenant safeguarding-incident search (restricted to platform safeguarding role)                                     |
| Entitlement gates                | `sports_sessions` (module master), `session_slot` (per-week cap), `session_private_lessons`, `session_coach_ratings`, `session_lesson_plans` |

### 1.1 Session composes ResourceBooking — doesn't own the slot

Session ALWAYS references a `resource_booking_id`. Starts_at + ends_at are
DERIVED from the booking — never stored on Session directly. To change the time,
use the `/reschedule` endpoint which swaps `resource_booking_id`. This keeps the
facility slot reservation as the single source of truth for "when is this
actually happening".

### 1.2 The safeguarding-incident chain

When a coach or admin observes a safeguarding-relevant incident (injury to a
minor, behavioural concern, boundary violation), they set
`safeguarding_incident_flag=true` on the session + write `session_notes`. This
fires:

- `SessionMinorSafeguardingIncident` (top-severity audit, regulator-facing)
- Cannot-opt-out `SessionSafeguardingIncidentNotification` to tenant owner +
  admin + designated safeguarding officer
- Extended retention on the session row (indefinite by default — never
  hard-deleted)

The chain-of-custody survives 7 years minimum + is regulator-queryable via
`/api/v1/platform/sessions/safeguarding-incidents` (restricted to platform
safeguarding role, every read audited).

### 1.3 Coach same-tenant hard boundary

Every coach reference on Session (head_coach_id + every entry in
assistant_coach_ids + supervising_staff_id) is verified same-tenant by the
observer. A cross-tenant assignment attempt returns 422 warn severity —
security-relevant because it could be a safeguarding-boundary violation attempt.

## 2. The row-level attribution contract

Per `.kiro/steering/tenancy-columns.md` §3 + §5:

- ✅ `sessions.tenant_id` — required, cascade
- ✅ `sessions.branch_id` — required, restrict
- ✅ `sessions.resource_booking_id` — required, restrict
- ❌ `sessions.application_id` — FORBIDDEN
- ❌ `sessions.organization_id` — FORBIDDEN (cascade through branch)
- ❌ `sessions.region_id` — FORBIDDEN (cascade through branch)
- ❌ `sessions.scope_node_id` — FORBIDDEN (not a scope consumer)
- ✅ `session_attendance.tenant_id` — required, cascade
- ✅ `session_attendance.session_id` — required, cascade
- ✅ `session_attendance.athlete_id` — required, restrict

## 3. Tier boundaries

| Tier       | Sessions/week | Private lessons | Coach ratings | Lesson plans |
| ---------- | ------------- | --------------- | ------------- | ------------ |
| Small      | 20            | ❌              | ❌            | ❌           |
| Medium     | 200           | ✅              | ✅            | ❌           |
| Enterprise | unlimited     | ✅              | ✅            | ✅           |

Backed by five entitlements — see `entitlements.json`.

## 4. Lifecycle state machine

```
[scheduled]                 default on create
    ↓ (admin confirm OR automated at starts_at - 24h)
[confirmed]                 attendance list is committed
    ↓ (starts_at reached OR admin start)
[in_progress]
    ↓ (ends_at + 15min grace OR admin complete OR under-minimum auto-cancel)
[completed]                 attendance snapshot frozen
    ↓ (admin archive)
[archived]                  extended retention if safeguarding-flagged

Alternative paths:
[scheduled|confirmed|in_progress] → [cancelled]  (admin cancel with reason)
[scheduled|confirmed] → [rescheduled]            (via /reschedule endpoint; resource_booking_id swapped)
```

### Post-scheduled guardrails

- **`session_type` immutable post-scheduled** (a practice becoming a lesson
  mid-flight is a data-entry error)
- **`team_id` immutable post-confirmed** (reassigning invalidates the roster)
- **`branch_id` immutable post-create** (session lives at a fixed branch)
- **`resource_booking_id` immutable via PATCH** (use /reschedule endpoint)
- **head_coach reassign <24h** requires `sessions.assign_coach.short-notice`
  (owner-only)
- **cancel <24h** requires `sessions.cancel.short-notice` (admin/owner)

## 5. Attendance flow

Coach mounts the touch-optimised `/sessions/{id}/attendance` screen during
check-in. For each registered athlete: big "Check in" / "Absent" buttons. Late
check-ins (past `session.attendance.late_grace_minutes` past starts_at)
automatically become `status='late'` with `late_minutes` computed.

The `checked_in_athletes_count` + `absent_athletes_count` are denormalised on
Session for fast list rendering. Nightly `ReconcileAttendanceCountsJob`
verifies + fixes drift.

`CancelUnderMinimumSessionsJob` runs every 5 minutes and auto-cancels sessions
where `checked_in_athletes_count < attendance_min` after
`session.phase_roll.under_minimum_grace_minutes` past starts_at (default 5
minutes). Fires `SessionAttendanceBelowMinimum` + `SessionCancelled` with
`trigger='automated_under_minimum'`.

## 6. What this module does NOT do

- **Doesn't own athletes.** Wave 3+ `athlete` module owns the `athletes` table;
  this module references via FK.
- **Doesn't own coaches.** Wave 2b `coaching` module owns Coach; this module
  references via FK.
- **Doesn't own bookings.** Facility module owns `resource_bookings`; session
  references via required FK.
- **Doesn't invoice.** Wave 4 finance module reads session_type +
  cancellation_notice_at + resource_booking pricing to generate invoices.
- **Doesn't broadcast video.** No live streaming per session (that's an Event
  feature).
- **Doesn't rate individual athletes.** Ratings are session-level (feed Coach).
  Per-athlete progress ratings are Wave 3+ athlete-progress module.
- **Doesn't manage lesson-plan libraries.** `lesson_plan_url` is a stored URL to
  whatever external doc service the tenant uses.

## 7. Cross-references

- `.kiro/steering/hierarchy.md` §1a — Session vocabulary
- `.kiro/steering/hierarchy.md` §7 — tier matrix
- `.kiro/steering/tenancy-columns.md` §3, §5 — column contract
- `modules/sports/blueprints/season/` — optional parent Season
- `modules/sports/blueprints/event/` — optional parent Event
- `modules/platform/blueprints/facility/schemas/resource-booking.schema.json` —
  the required booking primitive
- `modules/platform/blueprints/teams/` — optional parent Team
