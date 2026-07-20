# session — changelog

## [Unreleased] — inception (Wave 3b)

- Session module authored. Two owned entities:
  - `Session` (`ses_` prefix) — single practice / lesson / class instance
  - `SessionAttendance` (`sat_` prefix) — attendance pivot per athlete per
    session
- Six lifecycle statuses: scheduled → confirmed → in_progress → completed /
  cancelled / rescheduled. Automated transitions via StartScheduledSessionsJob +
  CompleteFinishedSessionsJob + CancelUnderMinimumSessionsJob (5-min cadence
  each).
- Session composes `facility::ResourceBooking` for the physical slot.
  starts_at + ends_at DERIVED from the booking. Reschedule via dedicated
  endpoint swaps the booking.
- Every Session carries `tenant_id` + `branch_id` + `resource_booking_id`.
  Optional `team_id` (standalone sessions allowed), `season_id`, `event_id`.
  NEVER `application_id`, `organization_id`, `region_id`, `scope_node_id`.
- Five entitlement gates:
  - `sports_sessions` (module master; all tiers)
  - `session_slot` (Small=20/week, Medium=200/week, Enterprise=null)
  - `session_private_lessons` (Medium+ — private_lesson + group_lesson types)
  - `session_coach_ratings` (Medium+ — rating aggregation feeds Coach)
  - `session_lesson_plans` (Enterprise-only — lesson_plan_url + long
    curriculum_topic)
- Attendance via `session_attendance` pivot. Denormalised counters on Session;
  nightly ReconcileAttendanceCountsJob keeps them in sync.
- Safeguarding chain: `safeguarding_incident_flag=true` fires
  `SessionMinorSafeguardingIncident` (regulator-tier retention + cannot-opt-out
  notifications to admin + safeguarding officer).
- Coach-continuity: head_coach reassign <24h + minors registered fires critical
  audit + cannot-opt-out notification chain to guardians.
- Under-minimum auto-cancel: sessions where checked_in_count < attendance_min
  after start auto-cancel via CancelUnderMinimumSessionsJob.
- Cascades: FacilityRetired → auto-cancel active sessions. CoachDeactivated →
  null head_coach + remove from assistants.
- Downstream: Wave 3+ athlete-progress reads Session outputs. Wave 4 finance
  invoices per session_type + cancellation_notice_at.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `branch`, `entitlements`, `teams`, `athlete`, `athlete-enrollment`, `season`,
  `age-group`, `facility`, `staff`.
- Extended by NONE. Wave 3+ attendance / finance / coaching / scheduling modules
  reference Session via FK — planned_consumers, not extendedBy.

### Design notes

- Session does NOT carry `application_id` / `organization_id` / `region_id` /
  `scope_node_id`.
- Session inherits temporal identity from `resource_booking_id`. starts_at +
  ends_at are derived attributes.
- `session_type` immutable post-scheduled.
- `branch_id` + `tenant_id` + `resource_booking_id` immutable post-create
  (compositional identity).
- `session_notes` is confidential — never rendered on public / participant wire;
  admin + coach + owner only.
- `safeguarding_incident_flag` write requires session_notes narrative
  - fires regulator-tier audit trail.
- Attendance for minor athletes has extended retention (safeguarding interest) —
  never hard-deletes independently of the session.

### ULID prefix registration

- `ses_` (Session) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
- `sat_` (SessionAttendance) — new. Same registration path.
